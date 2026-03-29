package com.axelfrache.questify.stats.service;

import com.axelfrache.questify.stats.dto.CategoryStatsResponse;
import com.axelfrache.questify.stats.dto.DailyStatsResponse;
import com.axelfrache.questify.stats.dto.OverallStatsResponse;
import com.axelfrache.questify.stats.dto.QuestHistoryResponse;
import com.axelfrache.questify.stats.model.QuestCompletionEntry;
import com.axelfrache.questify.stats.repository.QuestCompletionEntryRepository;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsService {

  private final QuestCompletionEntryRepository repository;

  @Transactional(readOnly = true)
  public OverallStatsResponse getOverallStats(UUID userId) {
    var total = repository.countTotalByUserId(userId);
    var totalXp = repository.sumXpByUserId(userId);
    var streak = computeCurrentStreak(userId);
    return new OverallStatsResponse(total, totalXp, streak);
  }

  @Transactional(readOnly = true)
  public Page<QuestHistoryResponse> getHistory(UUID userId, int page, int size) {
    return repository
        .findByUserIdOrderByCompletedAtDesc(userId, PageRequest.of(page, size))
        .map(e -> new QuestHistoryResponse(
            e.getQuestId(), e.getQuestTitle(), e.getXpEarned(),
            e.getCategoryName(), e.getCompletedAt()));
  }

  @Transactional(readOnly = true)
  public List<CategoryStatsResponse> getCategoryStats(UUID userId) {
    return repository.findCategoryStatsByUserId(userId);
  }

  @Transactional(readOnly = true)
  public List<DailyStatsResponse> getDailyStats(UUID userId, int days) {
    var today = LocalDate.now(ZoneOffset.UTC);
    var from = today.minusDays(days - 1L).atStartOfDay(ZoneOffset.UTC).toInstant();
    var to = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

    return repository.findByUserIdAndCompletedAtBetween(userId, from, to).stream()
        .collect(Collectors.groupingBy(
            e -> e.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate()))
        .entrySet().stream()
        .map(entry -> new DailyStatsResponse(
            entry.getKey(),
            entry.getValue().size(),
            entry.getValue().stream().mapToInt(QuestCompletionEntry::getXpEarned).sum()))
        .sorted(Comparator.comparing(DailyStatsResponse::date).reversed())
        .toList();
  }

  private int computeCurrentStreak(UUID userId) {
    var today = LocalDate.now(ZoneOffset.UTC);
    var from = today.minusDays(365).atStartOfDay(ZoneOffset.UTC).toInstant();
    var to = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

    var activeDays = repository.findCompletedAtByUserIdBetween(userId, from, to).stream()
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
