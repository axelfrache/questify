package com.axelfrache.questify.progression.service;

import com.axelfrache.questify.progression.dto.AchievementResponse;
import com.axelfrache.questify.progression.model.Achievement;
import com.axelfrache.questify.progression.model.QuestCompletionRecord;
import com.axelfrache.questify.progression.model.UserAchievement;
import com.axelfrache.questify.progression.repository.AchievementRepository;
import com.axelfrache.questify.progression.repository.QuestCompletionRecordRepository;
import com.axelfrache.questify.progression.repository.UserAchievementRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

  private static final String CODE_WEEK_STREAK = "WEEK_STREAK";
  private static final String CODE_MONTHLY_MASTER = "MONTHLY_MASTER";

  private final AchievementRepository achievementRepository;
  private final UserAchievementRepository userAchievementRepository;
  private final QuestCompletionRecordRepository questCompletionRecordRepository;

  @Transactional
  public List<AchievementResponse> checkAndUnlock(UUID userId) {
    var allAchievements = achievementRepository.findAll();
    Set<UUID> alreadyUnlocked = userAchievementRepository
        .findByUserIdOrderByUnlockedAtDesc(userId).stream()
        .map(ua -> ua.getAchievement().getId())
        .collect(Collectors.toSet());

    var toSave = new ArrayList<UserAchievement>();
    var responses = new ArrayList<AchievementResponse>();

    for (var achievement : allAchievements) {
      if (alreadyUnlocked.contains(achievement.getId())) continue;
      if (isEarned(achievement, userId)) {
        toSave.add(UserAchievement.builder().userId(userId).achievement(achievement).build());
        log.info("Achievement unlocked: {} for user {}", achievement.getCode(), userId);
        responses.add(toResponse(achievement, true, Instant.now()));
      }
    }

    if (!toSave.isEmpty()) userAchievementRepository.saveAll(toSave);
    return responses;
  }

  @Transactional(readOnly = true)
  public List<AchievementResponse> getAllAchievements(UUID userId) {
    var allAchievements = achievementRepository.findAll();
    var unlockedMap = unlockedMap(userId);
    return allAchievements.stream()
        .map(a -> {
          var ua = unlockedMap.get(a.getId());
          return toResponse(a, ua != null, ua != null ? ua.getUnlockedAt() : null);
        })
        .toList();
  }

  @Transactional(readOnly = true)
  public List<AchievementResponse> getUnlockedAchievements(UUID userId) {
    return userAchievementRepository.findByUserIdOrderByUnlockedAtDesc(userId).stream()
        .map(ua -> toResponse(ua.getAchievement(), true, ua.getUnlockedAt()))
        .toList();
  }

  private boolean isEarned(Achievement achievement, UUID userId) {
    return switch (achievement.getType()) {
      case GENERAL -> checkGeneral(achievement, userId);
      case CATEGORY -> checkCategory(achievement, userId);
    };
  }

  private boolean checkGeneral(Achievement achievement, UUID userId) {
    var today = LocalDate.now(ZoneOffset.UTC);
    return switch (achievement.getCode()) {
      case CODE_WEEK_STREAK -> {
        var from = today.minusDays(6).atStartOfDay(ZoneOffset.UTC).toInstant();
        var to = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        yield distinctActiveDays(
            questCompletionRecordRepository.findByUserIdAndCompletedAtBetween(userId, from, to))
            >= 7;
      }
      case CODE_MONTHLY_MASTER -> {
        var from = today.withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        var to = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        yield distinctActiveDays(
            questCompletionRecordRepository.findByUserIdAndCompletedAtBetween(userId, from, to))
            >= 30;
      }
      default -> questCompletionRecordRepository.countByUserId(userId) >= achievement.getThreshold();
    };
  }

  private boolean checkCategory(Achievement achievement, UUID userId) {
    if (achievement.getCategoryName() == null) return false;
    return questCompletionRecordRepository.countByUserIdAndCategoryNameIgnoreCase(
        userId, achievement.getCategoryName()) >= achievement.getThreshold();
  }

  private long distinctActiveDays(List<QuestCompletionRecord> records) {
    return records.stream()
        .map(r -> r.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate())
        .distinct()
        .count();
  }

  private Map<UUID, UserAchievement> unlockedMap(UUID userId) {
    return userAchievementRepository.findByUserIdOrderByUnlockedAtDesc(userId).stream()
        .collect(Collectors.toMap(ua -> ua.getAchievement().getId(), ua -> ua));
  }

  private AchievementResponse toResponse(Achievement a, boolean unlocked, Instant unlockedAt) {
    return new AchievementResponse(
        a.getId(), a.getCode(), a.getName(), a.getDescription(), a.getIcon(),
        a.getType(), a.getThreshold(), a.getCategoryName(), unlocked, unlockedAt);
  }
}
