package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.dto.ChangePasswordRequest;
import com.axelfrache.questify.auth.dto.UpdateUserRequest;
import com.axelfrache.questify.auth.dto.UserDto;
import com.axelfrache.questify.auth.messaging.UserEventPublisher;
import com.axelfrache.questify.auth.model.Role;
import com.axelfrache.questify.auth.model.User;
import com.axelfrache.questify.auth.repository.RefreshTokenRepository;
import com.axelfrache.questify.auth.repository.UserRepository;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final StorageService storageService;
  private final PasswordEncoder passwordEncoder;
  private final RefreshTokenRepository refreshTokenRepository;
  private final UserEventPublisher userEventPublisher;

  @Transactional(readOnly = true)
  public UserDto getUserById(UUID id) {
    return toUserDto(findUserOrThrow(id));
  }

  @Transactional
  public UserDto updateProfile(UUID userId, UpdateUserRequest request) {
    var user = findUserOrThrow(userId);

    if (request.username() != null && !request.username().isBlank()) {
      if (!request.username().equals(user.getUsername())
          && userRepository.existsByUsername(request.username()))
        throw new IllegalArgumentException("Username already exists");
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
  public void changePassword(UUID userId, ChangePasswordRequest request) {
    var user = findUserOrThrow(userId);

    if (!passwordEncoder.matches(request.currentPassword(), user.getPassword()))
      throw new IllegalArgumentException("Current password is incorrect");

    user.setPassword(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);
    refreshTokenRepository.revokeAllByUser(user);
  }

  @Transactional
  public UserDto updateProfilePicture(UUID userId, MultipartFile file) {
    var user = findUserOrThrow(userId);

    Optional.ofNullable(user.getProfilePictureUrl()).ifPresent(storageService::deleteFile);

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

  @Transactional
  public void deleteAccount(UUID userId, String password) {
    var user = findUserOrThrow(userId);

    if (!passwordEncoder.matches(password, user.getPassword()))
      throw new IllegalArgumentException("Password is incorrect");

    performDelete(user);
  }

  @Transactional
  public void forceDeleteUser(UUID userId) {
    performDelete(findUserOrThrow(userId));
  }

  @Transactional
  public UserDto updateUserRole(UUID userId, Role role) {
    var user = findUserOrThrow(userId);
    user.setRole(role);
    userRepository.save(user);
    return toUserDto(user);
  }

  @Transactional
  public UserDto updateUserStatus(UUID userId, boolean isEnabled) {
    var user = findUserOrThrow(userId);
    user.setEnabled(isEnabled);
    userRepository.save(user);
    return toUserDto(user);
  }

  private void performDelete(User user) {
    var userId = user.getId();

    Optional.ofNullable(user.getProfilePictureUrl()).ifPresent(storageService::deleteFile);

    refreshTokenRepository.deleteByUser(user);
    userRepository.delete(user);

    userEventPublisher.publishUserDeleted(userId);
  }

  private User findUserOrThrow(UUID id) {
    return userRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
  }

  private UserDto toUserDto(User user) {
    return new UserDto(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getTimezone(),
        user.getProfilePictureUrl(),
        user.getCreatedAt(),
        user.getUpdatedAt(),
        user.getRole(),
        user.isEnabled());
  }
}
