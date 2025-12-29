package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.config.LevelConfig;
import com.axelfrache.questify.dto.ChangePasswordRequest;
import com.axelfrache.questify.dto.UpdateUserRequest;
import com.axelfrache.questify.model.Grade;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;

class UserServiceTest {

  private UserService userService;
  private UserRepository userRepository;
  private LevelConfig levelConfig;
  private StorageService storageService;

  private User testUser;
  private UUID userId;

  @BeforeEach
  void setUp() {
    userRepository = mock(UserRepository.class);
    levelConfig = new LevelConfig();
    levelConfig.setBaseXp(100);
    levelConfig.setMultiplier(1.0);
    storageService = mock(StorageService.class);

    userService = new UserService(userRepository, levelConfig, storageService);

    userId = UUID.randomUUID();
    testUser = new User();
    testUser.setId(userId);
    testUser.setUsername("testuser");
    testUser.setEmail("test@example.com");
    testUser.setPassword("$2a$10$hashedpassword");
    testUser.setTotalXp(0);
    testUser.setTimezone("UTC");
  }

  @Test
  void getUserById_shouldReturnUser_whenExists() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var result = userService.getUserById(userId);

    assertNotNull(result);
    assertEquals("testuser", result.username());
    assertEquals("test@example.com", result.email());
  }

  @Test
  void getUserById_shouldThrow_whenNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class, () -> userService.getUserById(userId));
  }

  @Test
  void getUserProgression_shouldCalculateLevelAndGrade() {
    testUser.setTotalXp(150);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var progression = userService.getUserProgression(userId);

    assertNotNull(progression);
    assertEquals(2, progression.level());
    assertEquals(Grade.INITIATE, progression.grade());
    assertEquals("Initiate", progression.gradeLabel());
  }

  @Test
  void getUserProgression_shouldReturnLevel1_whenNoXp() {
    testUser.setTotalXp(0);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var progression = userService.getUserProgression(userId);

    assertEquals(1, progression.level());
    assertEquals(0, progression.totalXp());
  }

  @Test
  void updateProfile_shouldUpdateUsername() {
    var request = new UpdateUserRequest("newusername", null);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(userRepository.existsByUsername("newusername")).thenReturn(false);

    var result = userService.updateProfile(userId, request);

    assertEquals("newusername", result.username());
    verify(userRepository).save(testUser);
  }

  @Test
  void updateProfile_shouldThrow_whenUsernameExists() {
    var request = new UpdateUserRequest("existinguser", null);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(userRepository.existsByUsername("existinguser")).thenReturn(true);

    assertThrows(IllegalArgumentException.class, () -> userService.updateProfile(userId, request));
  }

  @Test
  void updateProfile_shouldNotCheck_whenUsernameSame() {
    var request = new UpdateUserRequest("testuser", null);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var result = userService.updateProfile(userId, request);

    assertEquals("testuser", result.username());
    verify(userRepository, never()).existsByUsername(any());
  }

  @Test
  void updateProfile_shouldValidateTimezone() {
    var request = new UpdateUserRequest(null, "Europe/Paris");
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var result = userService.updateProfile(userId, request);

    assertEquals("Europe/Paris", result.timezone());
  }

  @Test
  void updateProfile_shouldThrow_whenInvalidTimezone() {
    var request = new UpdateUserRequest(null, "Invalid/Timezone");
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    assertThrows(IllegalArgumentException.class, () -> userService.updateProfile(userId, request));
  }

  @Test
  void changePassword_shouldThrow_whenCurrentIncorrect() {
    var request = new ChangePasswordRequest("wrongpassword", "newpassword");
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    assertThrows(IllegalArgumentException.class, () -> userService.changePassword(userId, request));
  }

  @Test
  void addXp_shouldIncreaseUserXp() {
    testUser.setTotalXp(100);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    userService.addXp(userId, 50);

    assertEquals(150, testUser.getTotalXp());
    verify(userRepository).save(testUser);
  }

  @Test
  void calculateLevel_shouldReturnLevel1_whenZeroXp() {
    assertEquals(1, userService.calculateLevel(0));
  }

  @Test
  void calculateLevel_shouldReturnLevel1_whenBelowThreshold() {
    assertEquals(1, userService.calculateLevel(50));
  }

  @Test
  void calculateLevel_shouldReturnLevel2_whenAtThreshold() {
    assertEquals(2, userService.calculateLevel(100));
  }

  @Test
  void calculateLevel_shouldReturnHigherLevel_whenMoreXp() {
    // Level 1: 100, Level 2: 200, Level 3: 300 -> Total 600 = Level 4
    assertEquals(4, userService.calculateLevel(600));
  }

  @Test
  void currentLevelXp_shouldReturnXpInCurrentLevel() {
    // At 150 XP, we're in Level 2 (needs 100 for L1), so 50 XP into Level 2
    assertEquals(50, userService.currentLevelXp(150));
  }

  @Test
  void nextLevelXp_shouldReturnRequiredXpForNextLevel() {
    // At Level 1 (50 XP), requires 100 XP to reach Level 2
    assertEquals(100, userService.nextLevelXp(50));
  }

  @Test
  void nextLevelXp_shouldReturnLevel2Requirements_whenInLevel2() {
    // At 150 XP (Level 2), requires 200 XP to reach Level 3
    assertEquals(200, userService.nextLevelXp(150));
  }

  @Test
  void progressPercent_shouldReturnPercentage() {
    // At 50 XP in Level 1, we're 50% through Level 1 (needs 100)
    assertEquals(50.0, userService.progressPercent(50));
  }

  @Test
  void progressPercent_shouldReturn100_whenAtLevelBoundary() {
    // At 100 XP, we just moved to Level 2, so 0% through Level 2
    assertEquals(0.0, userService.progressPercent(100));
  }

  @Test
  void updateProfilePicture_shouldUploadAndSave() {
    var file = mock(MultipartFile.class);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(storageService.uploadProfilePicture(userId, file))
        .thenReturn("https://s3.example.com/bucket/profile.jpg");

    var result = userService.updateProfilePicture(userId, file);

    assertEquals("https://s3.example.com/bucket/profile.jpg", result.profilePictureUrl());
    verify(storageService).uploadProfilePicture(userId, file);
    verify(userRepository).save(testUser);
  }

  @Test
  void updateProfilePicture_shouldDeleteOldPicture() {
    testUser.setProfilePictureUrl("https://s3.example.com/bucket/old.jpg");
    var file = mock(MultipartFile.class);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(storageService.uploadProfilePicture(userId, file))
        .thenReturn("https://s3.example.com/bucket/new.jpg");

    userService.updateProfilePicture(userId, file);

    verify(storageService).deleteFile("https://s3.example.com/bucket/old.jpg");
  }

  @Test
  void deleteProfilePicture_shouldRemoveUrl() {
    testUser.setProfilePictureUrl("https://s3.example.com/bucket/profile.jpg");
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var result = userService.deleteProfilePicture(userId);

    assertNull(result.profilePictureUrl());
    verify(storageService).deleteFile("https://s3.example.com/bucket/profile.jpg");
    verify(userRepository).save(testUser);
  }

  @Test
  void deleteProfilePicture_shouldDoNothing_whenNoPicture() {
    testUser.setProfilePictureUrl(null);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    userService.deleteProfilePicture(userId);

    verify(storageService, never()).deleteFile(any());
    verify(userRepository, never()).save(any());
  }
}
