package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.UserDto;
import com.axelfrache.questify.model.InstanceSettings;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.InstanceSettingsRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

  private final UserRepository userRepository;
  private final InstanceSettingsRepository instanceSettingsRepository;
  private final com.axelfrache.questify.service.UserService userService;

  @GetMapping("/settings")
  public ResponseEntity<InstanceSettings> getSettings() {
    return ResponseEntity.of(instanceSettingsRepository.findFirstByOrderByUpdatedAtDesc());
  }

  @PatchMapping("/settings")
  public ResponseEntity<InstanceSettings> updateSettings(
      @RequestBody Map<String, Boolean> updates) {
    var settings =
        instanceSettingsRepository
            .findFirstByOrderByUpdatedAtDesc()
            .orElseThrow(() -> new IllegalStateException("Instance settings not initialized"));

    if (updates.containsKey("registrationEnabled")) {
      settings.setRegistrationEnabled(updates.get("registrationEnabled"));
    }

    return ResponseEntity.ok(instanceSettingsRepository.save(settings));
  }

  @GetMapping("/users")
  public ResponseEntity<Page<UserDto>> listUsers(
      @PageableDefault(size = 20) Pageable pageable, @RequestParam(required = false) String query) {
    Page<User> users;
    if (query != null && !query.isBlank()) {
      users =
          userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
              query, query, pageable);
    } else {
      users = userRepository.findAll(pageable);
    }
    return ResponseEntity.ok(users.map(this::mapToDto));
  }

  private UserDto mapToDto(User user) {
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

  @PostMapping("/users")
  public ResponseEntity<UserDto> createUser(
      @RequestBody @jakarta.validation.Valid com.axelfrache.questify.dto.AdminCreateUserRequest request) {
    return ResponseEntity.ok(userService.createUser(request));
  }

  @PutMapping("/users/{id}")
  public ResponseEntity<UserDto> updateUser(
      @PathVariable java.util.UUID id,
      @RequestBody @jakarta.validation.Valid com.axelfrache.questify.dto.AdminUpdateUserRequest request) {
    return ResponseEntity.ok(userService.updateUser(id, request));
  }

  @PatchMapping("/users/{id}/status")
  public ResponseEntity<UserDto> updateUserStatus(
      @PathVariable java.util.UUID id, @RequestBody Map<String, Boolean> statusUpdate) {
    if (!statusUpdate.containsKey("isEnabled")) {
      return ResponseEntity.badRequest().build();
    }
    return ResponseEntity.ok(userService.updateUserStatus(id, statusUpdate.get("isEnabled")));
  }

  @PatchMapping("/users/{id}/role")
  public ResponseEntity<UserDto> updateUserRole(
      @PathVariable java.util.UUID id, @RequestBody Map<String, String> roleUpdate) {
    if (!roleUpdate.containsKey("role")) {
      return ResponseEntity.badRequest().build();
    }
    try {
      com.axelfrache.questify.model.Role role =
          com.axelfrache.questify.model.Role.valueOf(roleUpdate.get("role"));
      return ResponseEntity.ok(userService.updateUserRole(id, role));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @DeleteMapping("/users/{id}")
  public ResponseEntity<Void> deleteUser(
      @PathVariable java.util.UUID id,
      @org.springframework.security.core.annotation.AuthenticationPrincipal User currentUser) {
    User user =
        userRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (currentUser.getId().equals(id)) {
      return ResponseEntity.badRequest().build();
    }

    userService.forceDeleteUser(id);
    return ResponseEntity.noContent().build();
  }
}
