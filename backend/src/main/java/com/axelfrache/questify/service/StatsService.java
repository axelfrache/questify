package com.axelfrache.questify.service;

import com.axelfrache.questify.dto.*;
import com.axelfrache.questify.model.QuestOccurrence;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
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

  private final QuestOccurrenceRepository questOccurrenceRepository;
  private final UserRepository userRepository;
  private final UserService userService;
  private final CategoryRepository categoryRepository;
  private final QuestTemplateRepository questTemplateRepository;

  @Transactional(readOnly = true)
  public DailyStats getDailyStats(UUID userId, LocalDate date) {
    var user = userRepository.findById(userId).orElseThrow();
    var completedToday =
        questOccurrenceRepository.findByUserIdAndScheduledDate(userId, date).stream()
            .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
            .toList();

    var allOccurrences = questOccurrenceRepository.findAllByUserId(userId);

    var completedOnDate =
        allOccurrences.stream()
            .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
            .filter(q -> q.getCompletedAt() != null)
            .filter(
                q ->
                    q.getCompletedAt()
                        .atZone(ZoneId.of(user.getTimezone()))
                        .toLocalDate()
                        .equals(date))
            .toList();

    var xpEarned = completedOnDate.stream().mapToInt(QuestOccurrence::getXpEarned).sum();

    return new DailyStats(date, completedOnDate.size(), xpEarned);
  }

  @Transactional(readOnly = true)
  public WeeklyStats getWeeklyStats(UUID userId) {
    var today = LocalDate.now();
    var weekStart = today.minusDays(6);

    var dailyBreakdown = new ArrayList<DailyStats>();
    for (var i = 0; i < 7; i++) dailyBreakdown.add(getDailyStats(userId, weekStart.plusDays(i)));
    var totalQuests = dailyBreakdown.stream().mapToInt(DailyStats::questsCompleted).sum();
    var totalXp = dailyBreakdown.stream().mapToLong(DailyStats::xpEarned).sum();
    var average = totalQuests / 7.0;

    return new WeeklyStats(totalQuests, totalXp, Math.round(average * 10) / 10.0, dailyBreakdown);
  }

  @Transactional(readOnly = true)
  public MonthlyStats getMonthlyStats(UUID userId) {
    var user = userRepository.findById(userId).orElseThrow();
    var occurrences = questOccurrenceRepository.findAllByUserId(userId);
    var today = LocalDate.now();
    var monthStart = today.withDayOfMonth(1);

    var completedThisMonth =
        occurrences.stream()
            .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
            .filter(q -> q.getCompletedAt() != null)
            .filter(
                q -> {
                  var completedDate =
                      q.getCompletedAt().atZone(ZoneId.of(user.getTimezone())).toLocalDate();
                  return !completedDate.isBefore(monthStart) && !completedDate.isAfter(today);
                })
            .toList();

    var xpEarned = completedThisMonth.stream().mapToInt(QuestOccurrence::getXpEarned).sum();

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
    var occurrences = questOccurrenceRepository.findAllByUserId(userId);

    var today = getDailyStats(userId, LocalDate.now());
    var thisWeek = getWeeklyStats(userId);
    var thisMonth = getMonthlyStats(userId);

    var totalCompleted =
        (int) occurrences.stream().filter(q -> q.getStatus() == QuestStatus.COMPLETED).count();

    var favoriteCategory =
        occurrences.stream()
            .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
            .filter(q -> q.getQuestTemplate().getCategory() != null)
            .collect(
                Collectors.groupingBy(
                    q -> q.getQuestTemplate().getCategory().getName(), Collectors.counting()))
            .entrySet()
            .stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(null);

    var levelProgress = userService.getUserProgression(userId);

    return new ProgressSummary(
        today, thisWeek, thisMonth, totalCompleted, favoriteCategory, levelProgress);
  }

  @Transactional(readOnly = true)
  public List<CategoryStats> getCategoryStats(UUID userId) {
    var user = userRepository.findById(userId).orElseThrow();
    var categories = categoryRepository.findAllForUser(user);
    var occurrences = questOccurrenceRepository.findAllByUserId(userId);

    return categories.stream()
        .map(
            category -> {
              var categoryOccurrences =
                  occurrences.stream()
                      .filter(
                          q ->
                              q.getQuestTemplate().getCategory() != null
                                  && q.getQuestTemplate()
                                      .getCategory()
                                      .getId()
                                      .equals(category.getId()))
                      .toList();

              var totalQuests = categoryOccurrences.size();
              var completedQuests =
                  (int)
                      categoryOccurrences.stream()
                          .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
                          .count();

              double progress =
                  totalQuests > 0 ? ((double) completedQuests / totalQuests) * 100 : 0;

              String grade;
              if (completedQuests >= 50) {
                grade = "Master";
              } else if (completedQuests >= 25) {
                grade = "Expert";
              } else if (completedQuests >= 10) {
                grade = "Explorer";
              } else if (completedQuests >= 5) {
                grade = "Apprentice";
              } else {
                grade = "Novice";
              }

              return new CategoryStats(
                  category.getId(),
                  category.getName(),
                  category.getIcon(),
                  category.getColor(),
                  totalQuests,
                  completedQuests,
                  progress,
                  grade);
            })
        .toList();
  }

  @Transactional(readOnly = true)
  public DailyCompletionRate getDailyCompletionRate(UUID userId, LocalDate date) {
    var plannedOccurrences = questOccurrenceRepository.findByUserIdAndScheduledDate(userId, date);
    var plannedCount = plannedOccurrences.size();
    var completedCount =
        (int)
            plannedOccurrences.stream().filter(q -> q.getStatus() == QuestStatus.COMPLETED).count();

    double rate = plannedCount > 0 ? ((double) completedCount / plannedCount) * 100 : 0;

    return new DailyCompletionRate(
        date, plannedCount, completedCount, Math.round(rate * 10) / 10.0);
  }

  @Transactional(readOnly = true)
  public List<RegionActivityStats> getRegionActivityStats(UUID userId) {
    var user = userRepository.findById(userId).orElseThrow();
    var categories = categoryRepository.findAllForUser(user);
    var occurrences = questOccurrenceRepository.findAllByUserId(userId);
    var today = LocalDate.now();
    var monthStart = today.withDayOfMonth(1);

    return categories.stream()
        .map(
            category -> {
              var completedThisMonth =
                  (int)
                      occurrences.stream()
                          .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
                          .filter(q -> q.getCompletedAt() != null)
                          .filter(
                              q ->
                                  q.getQuestTemplate().getCategory() != null
                                      && q.getQuestTemplate()
                                          .getCategory()
                                          .getId()
                                          .equals(category.getId()))
                          .filter(
                              q -> {
                                var completedDate =
                                    q.getCompletedAt()
                                        .atZone(ZoneId.of(user.getTimezone()))
                                        .toLocalDate();
                                return !completedDate.isBefore(monthStart)
                                    && !completedDate.isAfter(today);
                              })
                          .count();

              return new RegionActivityStats(
                  category.getId(),
                  category.getName(),
                  category.getIcon(),
                  category.getColor(),
                  completedThisMonth);
            })
        .sorted((a, b) -> Integer.compare(b.completedThisMonth(), a.completedThisMonth()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<DailyCompletionRate> getWeeklyCompletionRates(UUID userId) {
    var today = LocalDate.now();
    var weekStart = today.minusDays(6);

    var rates = new ArrayList<DailyCompletionRate>();
    for (var i = 0; i < 7; i++) {
      rates.add(getDailyCompletionRate(userId, weekStart.plusDays(i)));
    }

    return rates;
  }

  @Transactional(readOnly = true)
  public List<DailyCompletionRate> getMonthlyCompletionRates(UUID userId, int year, int month) {
    var firstDay = LocalDate.of(year, month, 1);
    var lastDay = firstDay.withDayOfMonth(firstDay.lengthOfMonth());

    var rates = new ArrayList<DailyCompletionRate>();
    for (var date = firstDay; !date.isAfter(lastDay); date = date.plusDays(1))
      rates.add(getDailyCompletionRate(userId, date));

    return rates;
  }
}
