package com.axelfrache.questify.progression.service;

import com.axelfrache.questify.progression.config.LevelConfig;
import com.axelfrache.questify.progression.dto.ProgressionResponse;
import com.axelfrache.questify.progression.model.Grade;
import com.axelfrache.questify.progression.model.QuestCompletionRecord;
import com.axelfrache.questify.progression.model.UserProgression;
import com.axelfrache.questify.progression.repository.QuestCompletionRecordRepository;
import com.axelfrache.questify.progression.repository.UserProgressionRepository;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressionService {

  private final UserProgressionRepository userProgressionRepository;
  private final QuestCompletionRecordRepository questCompletionRecordRepository;
  private final LevelConfig levelConfig;

  @Transactional
  public void awardXp(
      UUID userId, int amount, UUID questId, String categoryName, Instant completedAt) {
    var progression = findOrCreate(userId);

    var previousLevel = progression.getLevel();
    var previousGrade = progression.getGrade();

    progression.setTotalXp(progression.getTotalXp() + amount);

    var newLevel = calculateLevel(progression.getTotalXp());
    var newGrade = Grade.fromLevel(newLevel);
    progression.setLevel(newLevel);
    progression.setGrade(newGrade);
    userProgressionRepository.save(progression);

    questCompletionRecordRepository.save(
        QuestCompletionRecord.builder()
            .userId(userId)
            .questId(questId)
            .categoryName(categoryName)
            .completedAt(completedAt != null ? completedAt : Instant.now())
            .build());

    if (newLevel > previousLevel)
      log.info("User {} leveled up: {} -> {}", userId, previousLevel, newLevel);
    if (newGrade != previousGrade)
      log.info("User {} grade changed: {} -> {}", userId, previousGrade, newGrade);
  }

  @Transactional(readOnly = true)
  public ProgressionResponse getProgression(UUID userId) {
    return toResponse(findOrCreate(userId));
  }

  private UserProgression findOrCreate(UUID userId) {
    return userProgressionRepository
        .findByUserId(userId)
        .orElseGet(() -> UserProgression.builder().userId(userId).build());
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

  private ProgressionResponse toResponse(UserProgression p) {
    var level = p.getLevel();
    var grade = p.getGrade();
    var xpIntoCurrentLevel = p.getTotalXp() - levelConfig.totalXpForLevel(level - 1);
    var xpNeededForNext = levelConfig.requiredXpForLevel(level);
    var progressPercent =
        xpNeededForNext > 0 ? Math.min(100.0, xpIntoCurrentLevel * 100.0 / xpNeededForNext) : 100.0;

    return new ProgressionResponse(
        p.getUserId(),
        p.getTotalXp(),
        level,
        grade,
        grade.getLabel(),
        xpIntoCurrentLevel,
        xpNeededForNext,
        progressPercent);
  }
}
