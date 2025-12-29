package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.config.LevelConfig;
import com.axelfrache.questify.model.Grade;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ProgressionServiceTest {

  private ProgressionService progressionService;
  private UserRepository userRepository;
  private LevelConfig levelConfig;
  private AchievementService achievementService;

  private User testUser;
  private UUID userId;

  @BeforeEach
  void setUp() {
    userRepository = mock(UserRepository.class);
    levelConfig = new LevelConfig();
    levelConfig.setBaseXp(100);
    levelConfig.setMultiplier(1.0);
    achievementService = mock(AchievementService.class);

    progressionService = new ProgressionService(userRepository, levelConfig, achievementService);

    userId = UUID.randomUUID();
    testUser = new User();
    testUser.setId(userId);
    testUser.setTotalXp(0);
  }

  @Test
  void awardXp_shouldIncreaseUserXp() {
    testUser.setTotalXp(50);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementService.checkAndUnlock(userId)).thenReturn(List.of());

    var result = progressionService.awardXp(userId, 25, "Test");

    assertEquals(50, result.previousXp());
    assertEquals(75, result.currentXp());
    verify(userRepository).save(testUser);
  }

  @Test
  void awardXp_shouldDetectLevelUp() {
    testUser.setTotalXp(90);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementService.checkAndUnlock(userId)).thenReturn(List.of());

    var result = progressionService.awardXp(userId, 20, "Test");

    assertEquals(1, result.previousLevel());
    assertEquals(2, result.currentLevel());
    assertTrue(result.leveledUp());
  }

  @Test
  void awardXp_shouldNotDetectLevelUp_whenStillSameLevel() {
    testUser.setTotalXp(10);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementService.checkAndUnlock(userId)).thenReturn(List.of());

    var result = progressionService.awardXp(userId, 20, "Test");

    assertEquals(1, result.previousLevel());
    assertEquals(1, result.currentLevel());
    assertFalse(result.leveledUp());
  }

  @Test
  void awardXp_shouldDetectGradeChange() {
    // Total XP for Level 5 = 100+200+300+400+500 = 1500
    testUser.setTotalXp(1490);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementService.checkAndUnlock(userId)).thenReturn(List.of());

    var result = progressionService.awardXp(userId, 120, "Test");

    assertEquals(Grade.INITIATE, result.previousGrade());
    assertEquals(Grade.TRAVELER, result.currentGrade());
    assertTrue(result.gradeChanged());
  }

  @Test
  void awardXp_shouldCallAchievementCheck() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementService.checkAndUnlock(userId)).thenReturn(List.of());

    progressionService.awardXp(userId, 50, "Test");

    verify(achievementService).checkAndUnlock(userId);
  }

  @Test
  void awardXp_shouldThrow_whenUserNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(
        IllegalArgumentException.class, () -> progressionService.awardXp(userId, 50, "Test"));
  }

  @Test
  void calculateLevel_shouldReturnLevel1_whenZeroXp() {
    int level = progressionService.calculateLevel(0);

    assertEquals(1, level);
  }

  @Test
  void calculateLevel_shouldReturnLevel1_whenXpBelowThreshold() {
    int level = progressionService.calculateLevel(50);

    assertEquals(1, level);
  }

  @Test
  void calculateLevel_shouldReturnLevel2_whenXpReachesLevel2() {
    // Level 1 requires 100 XP, so 100 XP = Level 2
    int level = progressionService.calculateLevel(100);

    assertEquals(2, level);
  }

  @Test
  void calculateLevel_shouldIncreaseWithHigherXp() {
    // Level 1: 100, Level 2: 200, Level 3: 300 = Total 600 for Level 4
    int level = progressionService.calculateLevel(600);

    assertEquals(4, level);
  }
}
