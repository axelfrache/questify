package com.axelfrache.questify.service;

import com.axelfrache.questify.dto.AchievementResponse;
import com.axelfrache.questify.model.*;
import com.axelfrache.questify.repository.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

  private final AchievementRepository achievementRepository;
  private final UserAchievementRepository userAchievementRepository;
  private final QuestOccurrenceRepository questOccurrenceRepository;
  private final UserRepository userRepository;

  @Transactional
  public List<AchievementResponse> checkAndUnlock(UUID userId) {
    var user = userRepository.findById(userId).orElseThrow();
    var allAchievements = achievementRepository.findAll();
    var newlyUnlocked = new ArrayList<AchievementResponse>();

    for (var achievement : allAchievements) {
      if (userAchievementRepository.existsByUserAndAchievement(user, achievement)) continue;

      if (isAchievementEarned(user, achievement)) {
        var userAchievement = UserAchievement.builder().user(user).achievement(achievement).build();
        userAchievementRepository.save(userAchievement);
        log.info("Achievement unlocked: {} for user {}", achievement.getName(), userId);
        newlyUnlocked.add(toResponse(achievement, true, Instant.now()));
      }
    }

    return newlyUnlocked;
  }

  @Transactional(readOnly = true)
  public List<AchievementResponse> getAllAchievements(UUID userId) {
    var user = userRepository.findById(userId).orElseThrow();
    var allAchievements = achievementRepository.findAll();
    var unlockedMap = getUnlockedMap(user);

    return allAchievements.stream()
        .map(
            a -> {
              var userAchievement = unlockedMap.get(a.getId());
              var unlocked = userAchievement != null;
              var unlockedAt = unlocked ? userAchievement.getUnlockedAt() : null;
              return toResponse(a, unlocked, unlockedAt);
            })
        .toList();
  }

  @Transactional(readOnly = true)
  public List<AchievementResponse> getUnlockedAchievements(UUID userId) {
    var user = userRepository.findById(userId).orElseThrow();
    return userAchievementRepository.findByUserOrderByUnlockedAtDesc(user).stream()
        .map(ua -> toResponse(ua.getAchievement(), true, ua.getUnlockedAt()))
        .toList();
  }

  private boolean isAchievementEarned(User user, Achievement achievement) {
    return switch (achievement.getType()) {
      case GENERAL -> checkGeneralAchievement(user, achievement);
      case CATEGORY -> checkCategoryAchievement(user, achievement);
    };
  }

  private boolean checkGeneralAchievement(User user, Achievement achievement) {
    var occurrences = questOccurrenceRepository.findAllByUserId(user.getId());
    var completed =
        occurrences.stream().filter(q -> q.getStatus() == QuestStatus.COMPLETED).toList();

    return switch (achievement.getCode()) {
      case "FIRST_STEP" -> completed.size() >= 1;
      case "WEEK_STREAK" -> getActiveDaysInLast7Days(user, completed) >= 7;
      case "MONTHLY_MASTER" -> getActiveDaysInCurrentMonth(user, completed) >= 30;
      default -> completed.size() >= achievement.getThreshold();
    };
  }

  private boolean checkCategoryAchievement(User user, Achievement achievement) {
    if (achievement.getCategory() == null) return false;

    var occurrences = questOccurrenceRepository.findAllByUserId(user.getId());
    var completedInCategory =
        occurrences.stream()
            .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
            .filter(q -> q.getQuestTemplate().getCategory() != null)
            .filter(
                q ->
                    q.getQuestTemplate()
                        .getCategory()
                        .getId()
                        .equals(achievement.getCategory().getId()))
            .count();

    return completedInCategory >= achievement.getThreshold();
  }

  private int getActiveDaysInLast7Days(User user, List<QuestOccurrence> completed) {
    var today = LocalDate.now();
    var weekStart = today.minusDays(6);

    return (int)
        completed.stream()
            .filter(q -> q.getCompletedAt() != null)
            .map(q -> q.getCompletedAt().atZone(ZoneId.of(user.getTimezone())).toLocalDate())
            .filter(d -> !d.isBefore(weekStart) && !d.isAfter(today))
            .distinct()
            .count();
  }

  private int getActiveDaysInCurrentMonth(User user, List<QuestOccurrence> completed) {
    var today = LocalDate.now();
    var monthStart = today.withDayOfMonth(1);

    return (int)
        completed.stream()
            .filter(q -> q.getCompletedAt() != null)
            .map(q -> q.getCompletedAt().atZone(ZoneId.of(user.getTimezone())).toLocalDate())
            .filter(d -> !d.isBefore(monthStart) && !d.isAfter(today))
            .distinct()
            .count();
  }

  private Map<UUID, UserAchievement> getUnlockedMap(User user) {
    return userAchievementRepository.findByUserOrderByUnlockedAtDesc(user).stream()
        .collect(Collectors.toMap(ua -> ua.getAchievement().getId(), ua -> ua));
  }

  private AchievementResponse toResponse(
      Achievement achievement, boolean unlocked, Instant unlockedAt) {
    return new AchievementResponse(
        achievement.getId(),
        achievement.getCode(),
        achievement.getName(),
        achievement.getDescription(),
        achievement.getIcon(),
        achievement.getType(),
        achievement.getThreshold(),
        achievement.getCategory() != null ? achievement.getCategory().getName() : null,
        unlocked,
        unlockedAt);
  }
}
