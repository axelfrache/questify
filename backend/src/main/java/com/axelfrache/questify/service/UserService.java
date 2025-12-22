package com.axelfrache.questify.service;

import com.axelfrache.questify.config.LevelConfig;
import com.axelfrache.questify.dto.UpdateUserRequest;
import com.axelfrache.questify.dto.UserDto;
import com.axelfrache.questify.dto.UserProgressionDto;
import com.axelfrache.questify.model.Grade;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.UserRepository;
import java.time.ZoneId;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final LevelConfig levelConfig;
  private final StorageService storageService;

  @Transactional(readOnly = true)
  public UserDto getUserById(UUID id) {
    var user = findUserOrThrow(id);
    return toUserDto(user);
  }

  @Transactional(readOnly = true)
  public UserProgressionDto getUserProgression(UUID id) {
    var user = findUserOrThrow(id);
    return toProgressionDto(user);
  }

  @Transactional
  public UserDto updateProfile(UUID userId, UpdateUserRequest request) {
    var user = findUserOrThrow(userId);

    if (request.username() != null && !request.username().isBlank()) {
      if (!request.username().equals(user.getUsername())
          && userRepository.existsByUsername(request.username())) {
        throw new IllegalArgumentException("Username already exists");
      }
      user.setUsername(request.username());
    }

    if (request.timezone() != null && !request.timezone().isBlank())
      try {
        ZoneId.of(request.timezone());
        user.setTimezone(request.timezone());
      } catch (Exception e) {
        throw new IllegalArgumentException("Invalid timezone: " + request.timezone());
      }

    userRepository.save(user);
    return toUserDto(user);
  }

  @Transactional
  public void changePassword(
      UUID userId, com.axelfrache.questify.dto.ChangePasswordRequest request) {
    var user = findUserOrThrow(userId);
    var passwordEncoder = getPasswordEncoder();

    if (!passwordEncoder.matches(request.currentPassword(), user.getPassword()))
      throw new IllegalArgumentException("Current password is incorrect");

    user.setPassword(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);
  }

  private org.springframework.security.crypto.password.PasswordEncoder getPasswordEncoder() {
    return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
  }

  @Transactional
  public void addXp(UUID userId, int amount) {
    var user = findUserOrThrow(userId);
    user.setTotalXp(user.getTotalXp() + amount);
    userRepository.save(user);
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

  public long currentLevelXp(long totalXp) {
    var level = calculateLevel(totalXp);
    var xpAtLevelStart = 0L;

    for (var i = 1; i < level; i++) {
      xpAtLevelStart += levelConfig.requiredXpForLevel(i);
    }

    return totalXp - xpAtLevelStart;
  }

  public long nextLevelXp(long totalXp) {
    var level = calculateLevel(totalXp);
    return levelConfig.requiredXpForLevel(level);
  }

  public double progressPercent(long totalXp) {
    var current = currentLevelXp(totalXp);
    var required = nextLevelXp(totalXp);
    return required == 0 ? 100.0 : (double) current / required * 100.0;
  }

  private User findUserOrThrow(UUID id) {
    return userRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
  }

  @Transactional
  public UserDto updateProfilePicture(
      UUID userId, org.springframework.web.multipart.MultipartFile file) {
    var user = findUserOrThrow(userId);

    if (user.getProfilePictureUrl() != null) {
      storageService.deleteFile(user.getProfilePictureUrl());
    }

    var url = storageService.uploadProfilePicture(userId, file);
    user.setProfilePictureUrl(url);
    userRepository.save(user);

    return toUserDto(user);
  }

  @Transactional
  public UserDto deleteProfilePicture(UUID userId) {
    var user = findUserOrThrow(userId);

    if (user.getProfilePictureUrl() != null) {
      storageService.deleteFile(user.getProfilePictureUrl());
      user.setProfilePictureUrl(null);
      userRepository.save(user);
    }

    return toUserDto(user);
  }

  private UserDto toUserDto(User user) {
    return new UserDto(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getTimezone(),
        user.getProfilePictureUrl(),
        user.getCreatedAt(),
        user.getUpdatedAt());
  }

  private UserProgressionDto toProgressionDto(User user) {
    var level = calculateLevel(user.getTotalXp());
    var grade = Grade.fromLevel(level);
    var currentXp = currentLevelXp(user.getTotalXp());
    var requiredXp = nextLevelXp(user.getTotalXp());
    var progress = progressPercent(user.getTotalXp());

    return new UserProgressionDto(
        user.getId(),
        user.getUsername(),
        user.getTotalXp(),
        level,
        grade,
        grade.getLabel(),
        currentXp,
        requiredXp,
        Math.round(progress * 100.0) / 100.0);
  }
}
