package com.axelfrache.questify.stats.service;

import com.axelfrache.questify.stats.dto.CategoryStatsResponse;
import com.axelfrache.questify.stats.dto.DailyStatsResponse;
import com.axelfrache.questify.stats.dto.OverallStatsResponse;
import com.axelfrache.questify.stats.dto.QuestHistoryResponse;
import com.axelfrache.questify.stats.model.QuestCompletionEntry;
import com.axelfrache.questify.stats.repository.QuestCompletionEntryRepository;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsService {

  private final QuestCompletionEntryRepository repository;

  @WithSpan("stats.get_overview")
  @Cacheable(cacheNames = "stats.overview", key = "#userId")
  @Transactional(readOnly = true)
  public OverallStatsResponse getOverallStats(UUID userId) {
    var total = repository.countTotalByUserId(userId);
    var totalXp = repository.sumXpByUserId(userId);
    var streak = computeCurrentStreak(userId);
    return new OverallStatsResponse(total, totalXp, streak);
  }

  @WithSpan("stats.get_history")
  @Transactional(readOnly = true)
  public Page<QuestHistoryResponse> getHistory(UUID userId, int page, int size) {
    return repository
        .findByUserIdOrderByCompletedAtDesc(userId, PageRequest.of(page, size))
        .map(
            e ->
                new QuestHistoryResponse(
                    e.getQuestId(),
                    e.getQuestTitle(),
                    e.getXpEarned(),
                    e.getCategoryName(),
                    e.getCompletedAt()));
  }

  @WithSpan("stats.get_by_category")
  @Cacheable(cacheNames = "stats.categories", key = "#userId")
  @Transactional(readOnly = true)
  public List<CategoryStatsResponse> getCategoryStats(UUID userId) {
    return repository.findCategoryStatsByUserId(userId);
  }

  @WithSpan("stats.get_daily")
  @Cacheable(cacheNames = "stats.daily", key = "#userId + '-' + #days")
  @Transactional(readOnly = true)
  public List<DailyStatsResponse> getDailyStats(UUID userId, int days) {
    var today = LocalDate.now(ZoneOffset.UTC);
    var from = today.minusDays(days - 1L).atStartOfDay(ZoneOffset.UTC).toInstant();
    var to = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

    return repository.findByUserIdAndCompletedAtBetween(userId, from, to).stream()
        .collect(
            Collectors.groupingBy(e -> e.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate()))
        .entrySet()
        .stream()
        .map(
            entry ->
                new DailyStatsResponse(
                    entry.getKey(),
                    entry.getValue().size(),
                    entry.getValue().stream().mapToInt(QuestCompletionEntry::getXpEarned).sum()))
        .sorted(Comparator.comparing(DailyStatsResponse::date).reversed())
        .toList();
  }

  @Caching(
      evict = {
        @CacheEvict(cacheNames = "stats.overview", key = "#userId"),
        @CacheEvict(cacheNames = "stats.categories", key = "#userId"),
        @CacheEvict(cacheNames = "stats.daily", allEntries = true)
      })
  public void invalidateUserStatsCache(UUID userId) {}

  private int computeCurrentStreak(UUID userId) {
    var today = LocalDate.now(ZoneOffset.UTC);
    var from = today.minusDays(365).atStartOfDay(ZoneOffset.UTC).toInstant();
    var to = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

    var activeDays =
        repository.findCompletedAtByUserIdBetween(userId, from, to).stream()
            .map(instant -> instant.atZone(ZoneOffset.UTC).toLocalDate())
            .collect(Collectors.toSet());

    var start = activeDays.contains(today) ? today : today.minusDays(1);
    var streak = 0;
    var day = start;
    while (activeDays.contains(day)) {
      streak++;
      day = day.minusDays(1);
    }
    return streak;
  }
}
