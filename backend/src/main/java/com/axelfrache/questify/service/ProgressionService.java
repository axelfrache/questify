package com.axelfrache.questify.service;

import com.axelfrache.questify.config.LevelConfig;
import com.axelfrache.questify.dto.ProgressionResult;
import com.axelfrache.questify.model.Grade;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressionService {

  private final UserRepository userRepository;
  private final LevelConfig levelConfig;
  private final AchievementService achievementService;

  @Transactional
  public ProgressionResult awardXp(UUID userId, int amount, String source) {
    var user = findUserOrThrow(userId);

    var previousXp = user.getTotalXp();
    var previousLevel = calculateLevel(previousXp);
    var previousGrade = Grade.fromLevel(previousLevel);

    user.setTotalXp(previousXp + amount);
    userRepository.save(user);

    var currentXp = user.getTotalXp();
    var currentLevel = calculateLevel(currentXp);
    var currentGrade = Grade.fromLevel(currentLevel);

    var leveledUp = currentLevel > previousLevel;
    var gradeChanged = currentGrade != previousGrade;

    if (leveledUp)
      log.info("User {} leveled up: {} -> {} ({})", userId, previousLevel, currentLevel, source);
    if (gradeChanged)
      log.info("User {} grade changed: {} -> {} ({})", userId, previousGrade, currentGrade, source);

    achievementService.checkAndUnlock(userId);

    return new ProgressionResult(
        previousXp,
        currentXp,
        previousLevel,
        currentLevel,
        previousGrade,
        currentGrade,
        leveledUp,
        gradeChanged);
  }

  public int calculateLevel(long totalXp) {
    var level = 1;
    var accumulated = 0L;

    while (true) {
      var required = levelConfig.requiredXpForLevel(level);
      if (accumulated + required > totalXp) break;
      accumulated += required;
      level++;
    }

    return level;
  }

  private User findUserOrThrow(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
  }
}
