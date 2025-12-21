package com.axelfrache.questify.service;

import com.axelfrache.questify.dto.*;
import com.axelfrache.questify.model.Quest;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.repository.QuestRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsService {

  private final QuestRepository questRepository;
  private final UserRepository userRepository;
  private final UserService userService;

  @Transactional(readOnly = true)
  public DailyStats getDailyStats(UUID userId, LocalDate date) {
    var user = userRepository.findById(userId).orElseThrow();
    var quests = questRepository.findByUserOrderByCreatedAtDesc(user);

    var completedToday =
        quests.stream()
            .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
            .filter(q -> q.getCompletedAt() != null)
            .filter(
                q ->
                    q.getCompletedAt()
                        .atZone(ZoneId.of(user.getTimezone()))
                        .toLocalDate()
                        .equals(date))
            .toList();

    var xpEarned = completedToday.stream().mapToLong(Quest::calculateTotalXpReward).sum();

    return new DailyStats(date, completedToday.size(), xpEarned);
  }

  @Transactional(readOnly = true)
  public WeeklyStats getWeeklyStats(UUID userId) {
    var today = LocalDate.now();
    var weekStart = today.minusDays(6);

    var dailyBreakdown = new ArrayList<DailyStats>();
    for (var i = 0; i < 7; i++) {
      dailyBreakdown.add(getDailyStats(userId, weekStart.plusDays(i)));
    }

    var totalQuests = dailyBreakdown.stream().mapToInt(DailyStats::questsCompleted).sum();
    var totalXp = dailyBreakdown.stream().mapToLong(DailyStats::xpEarned).sum();
    var average = totalQuests / 7.0;

    return new WeeklyStats(totalQuests, totalXp, Math.round(average * 10) / 10.0, dailyBreakdown);
  }

  @Transactional(readOnly = true)
  public MonthlyStats getMonthlyStats(UUID userId) {
    var user = userRepository.findById(userId).orElseThrow();
    var quests = questRepository.findByUserOrderByCreatedAtDesc(user);
    var today = LocalDate.now();
    var monthStart = today.withDayOfMonth(1);

    var completedThisMonth =
        quests.stream()
            .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
            .filter(q -> q.getCompletedAt() != null)
            .filter(
                q -> {
                  var completedDate =
                      q.getCompletedAt().atZone(ZoneId.of(user.getTimezone())).toLocalDate();
                  return !completedDate.isBefore(monthStart) && !completedDate.isAfter(today);
                })
            .toList();

    var xpEarned = completedThisMonth.stream().mapToLong(Quest::calculateTotalXpReward).sum();

    var activeDays =
        completedThisMonth.stream()
            .map(q -> q.getCompletedAt().atZone(ZoneId.of(user.getTimezone())).toLocalDate())
            .collect(Collectors.toSet())
            .size();

    return new MonthlyStats(completedThisMonth.size(), xpEarned, activeDays);
  }

  @Transactional(readOnly = true)
  public ProgressSummary getProgressSummary(UUID userId) {
    var user = userRepository.findById(userId).orElseThrow();
    var quests = questRepository.findByUserOrderByCreatedAtDesc(user);

    var today = getDailyStats(userId, LocalDate.now());
    var thisWeek = getWeeklyStats(userId);
    var thisMonth = getMonthlyStats(userId);

    var totalCompleted =
        (int) quests.stream().filter(q -> q.getStatus() == QuestStatus.COMPLETED).count();

    var favoriteCategory =
        quests.stream()
            .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
            .filter(q -> q.getCategory() != null)
            .collect(Collectors.groupingBy(q -> q.getCategory().getName(), Collectors.counting()))
            .entrySet()
            .stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(null);

    var levelProgress = userService.getUserProgression(userId);

    return new ProgressSummary(
        today, thisWeek, thisMonth, totalCompleted, favoriteCategory, levelProgress);
  }
}
