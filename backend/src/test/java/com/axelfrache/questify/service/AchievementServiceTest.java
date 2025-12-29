package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.model.*;
import com.axelfrache.questify.repository.AchievementRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.UserAchievementRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AchievementServiceTest {

  private AchievementService achievementService;
  private AchievementRepository achievementRepository;
  private UserAchievementRepository userAchievementRepository;
  private QuestOccurrenceRepository questOccurrenceRepository;
  private UserRepository userRepository;

  private User testUser;
  private UUID userId;

  @BeforeEach
  void setUp() {
    achievementRepository = mock(AchievementRepository.class);
    userAchievementRepository = mock(UserAchievementRepository.class);
    questOccurrenceRepository = mock(QuestOccurrenceRepository.class);
    userRepository = mock(UserRepository.class);

    achievementService =
        new AchievementService(
            achievementRepository,
            userAchievementRepository,
            questOccurrenceRepository,
            userRepository);

    userId = UUID.randomUUID();
    testUser = new User();
    testUser.setId(userId);
    testUser.setTimezone("UTC");
  }

  @Test
  void checkAndUnlock_shouldUnlockFirstStep_whenOneQuestCompleted() {
    var achievement = createAchievement("FIRST_STEP", AchievementType.GENERAL, 1);
    var occurrence = createCompletedOccurrence();

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementRepository.findAll()).thenReturn(List.of(achievement));
    when(userAchievementRepository.existsByUserAndAchievement(testUser, achievement))
        .thenReturn(false);
    when(questOccurrenceRepository.findAllByUserId(userId)).thenReturn(List.of(occurrence));

    var unlocked = achievementService.checkAndUnlock(userId);

    assertEquals(1, unlocked.size());
    assertEquals("FIRST_STEP", unlocked.get(0).code());
    assertTrue(unlocked.get(0).unlocked());
    verify(userAchievementRepository).save(any(UserAchievement.class));
  }

  @Test
  void checkAndUnlock_shouldNotUnlock_whenAlreadyUnlocked() {
    var achievement = createAchievement("FIRST_STEP", AchievementType.GENERAL, 1);

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementRepository.findAll()).thenReturn(List.of(achievement));
    when(userAchievementRepository.existsByUserAndAchievement(testUser, achievement))
        .thenReturn(true);

    var unlocked = achievementService.checkAndUnlock(userId);

    assertTrue(unlocked.isEmpty());
    verify(userAchievementRepository, never()).save(any());
  }

  @Test
  void checkAndUnlock_shouldNotUnlock_whenThresholdNotMet() {
    var achievement = createAchievement("QUEST_MASTER", AchievementType.GENERAL, 100);

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementRepository.findAll()).thenReturn(List.of(achievement));
    when(userAchievementRepository.existsByUserAndAchievement(testUser, achievement))
        .thenReturn(false);
    when(questOccurrenceRepository.findAllByUserId(userId)).thenReturn(List.of());

    var unlocked = achievementService.checkAndUnlock(userId);

    assertTrue(unlocked.isEmpty());
  }

  @Test
  void checkAndUnlock_shouldThrow_whenUserNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(NoSuchElementException.class, () -> achievementService.checkAndUnlock(userId));
  }

  @Test
  void getAllAchievements_shouldReturnAllWithUnlockedStatus() {
    var achievement1 = createAchievement("FIRST_STEP", AchievementType.GENERAL, 1);
    var achievement2 = createAchievement("QUEST_MASTER", AchievementType.GENERAL, 100);

    var userAchievement = new UserAchievement();
    userAchievement.setAchievement(achievement1);
    userAchievement.setUnlockedAt(Instant.now());

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementRepository.findAll()).thenReturn(List.of(achievement1, achievement2));
    when(userAchievementRepository.findByUserOrderByUnlockedAtDesc(testUser))
        .thenReturn(List.of(userAchievement));

    var achievements = achievementService.getAllAchievements(userId);

    assertEquals(2, achievements.size());
    assertTrue(achievements.stream().anyMatch(a -> a.code().equals("FIRST_STEP") && a.unlocked()));
    assertTrue(
        achievements.stream().anyMatch(a -> a.code().equals("QUEST_MASTER") && !a.unlocked()));
  }

  @Test
  void getAllAchievements_shouldThrow_whenUserNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(NoSuchElementException.class, () -> achievementService.getAllAchievements(userId));
  }

  @Test
  void getUnlockedAchievements_shouldReturnOnlyUnlocked() {
    var achievement = createAchievement("FIRST_STEP", AchievementType.GENERAL, 1);
    var userAchievement = new UserAchievement();
    userAchievement.setAchievement(achievement);
    userAchievement.setUnlockedAt(Instant.now());

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(userAchievementRepository.findByUserOrderByUnlockedAtDesc(testUser))
        .thenReturn(List.of(userAchievement));

    var unlocked = achievementService.getUnlockedAchievements(userId);

    assertEquals(1, unlocked.size());
    assertTrue(unlocked.get(0).unlocked());
  }

  @Test
  void getUnlockedAchievements_shouldReturnEmpty_whenNoneUnlocked() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(userAchievementRepository.findByUserOrderByUnlockedAtDesc(testUser)).thenReturn(List.of());

    var unlocked = achievementService.getUnlockedAchievements(userId);

    assertTrue(unlocked.isEmpty());
  }

  @Test
  void checkAndUnlock_shouldUnlockCategoryAchievement_whenThresholdMet() {
    var category = new Category();
    category.setId(UUID.randomUUID());
    category.setName("Health");

    var achievement = createCategoryAchievement("HEALTH_10", category, 10);

    var template = new QuestTemplate();
    template.setCategory(category);

    var occurrences =
        java.util.stream.IntStream.range(0, 10)
            .mapToObj(i -> createCompletedOccurrenceWithTemplate(template))
            .toList();

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(achievementRepository.findAll()).thenReturn(List.of(achievement));
    when(userAchievementRepository.existsByUserAndAchievement(testUser, achievement))
        .thenReturn(false);
    when(questOccurrenceRepository.findAllByUserId(userId)).thenReturn(occurrences);

    var unlocked = achievementService.checkAndUnlock(userId);

    assertEquals(1, unlocked.size());
    assertEquals("HEALTH_10", unlocked.get(0).code());
  }

  private Achievement createAchievement(String code, AchievementType type, int threshold) {
    var achievement = new Achievement();
    achievement.setId(UUID.randomUUID());
    achievement.setCode(code);
    achievement.setName(code);
    achievement.setType(type);
    achievement.setThreshold(threshold);
    return achievement;
  }

  private Achievement createCategoryAchievement(String code, Category category, int threshold) {
    var achievement = createAchievement(code, AchievementType.CATEGORY, threshold);
    achievement.setCategory(category);
    return achievement;
  }

  private QuestOccurrence createCompletedOccurrence() {
    var template = new QuestTemplate();
    template.setUser(testUser);
    return createCompletedOccurrenceWithTemplate(template);
  }

  private QuestOccurrence createCompletedOccurrenceWithTemplate(QuestTemplate template) {
    var occurrence = new QuestOccurrence();
    occurrence.setStatus(QuestStatus.COMPLETED);
    occurrence.setCompletedAt(Instant.now());
    occurrence.setQuestTemplate(template);
    return occurrence;
  }
}
