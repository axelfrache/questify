package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.AdminUpdateSettingsRequest;
import com.axelfrache.questify.dto.AdminUserRoleUpdateRequest;
import com.axelfrache.questify.dto.AdminUserStatusUpdateRequest;
import com.axelfrache.questify.dto.UserDto;
import com.axelfrache.questify.model.InstanceSettings;
import com.axelfrache.questify.model.Role;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.InstanceSettingsRepository;
import com.axelfrache.questify.repository.UserRepository;
import com.axelfrache.questify.security.SecurityUtils;
import jakarta.validation.Valid;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

  private final UserRepository userRepository;
  private final InstanceSettingsRepository instanceSettingsRepository;
  private final com.axelfrache.questify.service.UserService userService;
  private final SecurityUtils securityUtils;

  @GetMapping("/settings")
  public ResponseEntity<InstanceSettings> getSettings() {
    return ResponseEntity.of(instanceSettingsRepository.findFirstByOrderByUpdatedAtDesc());
  }

  @PatchMapping("/settings")
  public ResponseEntity<InstanceSettings> updateSettings(
      @Valid @RequestBody AdminUpdateSettingsRequest request) {
    var settings =
        instanceSettingsRepository
            .findFirstByOrderByUpdatedAtDesc()
            .orElseThrow(() -> new IllegalStateException("Instance settings not initialized"));

    settings.setRegistrationEnabled(request.registrationEnabled());

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
    } else users = userRepository.findAll(pageable);
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
      @RequestBody @Valid com.axelfrache.questify.dto.AdminCreateUserRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
  }

  @PutMapping("/users/{id}")
  public ResponseEntity<UserDto> updateUser(
      @PathVariable UUID id,
      @RequestBody @Valid com.axelfrache.questify.dto.AdminUpdateUserRequest request) {
    return ResponseEntity.ok(userService.updateUser(id, request));
  }

  @PatchMapping("/users/{id}/status")
  public ResponseEntity<UserDto> updateUserStatus(
      @PathVariable UUID id, @RequestBody @Valid AdminUserStatusUpdateRequest statusUpdate) {
    return ResponseEntity.ok(userService.updateUserStatus(id, statusUpdate.isEnabled()));
  }

  @PatchMapping("/users/{id}/role")
  public ResponseEntity<UserDto> updateUserRole(
      @PathVariable UUID id, @RequestBody @Valid AdminUserRoleUpdateRequest roleUpdate) {
    try {
      var role = Role.valueOf(roleUpdate.role().trim().toUpperCase(Locale.ROOT));
      return ResponseEntity.ok(userService.updateUserRole(id, role));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @DeleteMapping("/users/{id}")
  public ResponseEntity<Void> deleteUser(
      @PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
    if (!userRepository.existsById(id)) throw new IllegalArgumentException("User not found");
    var currentUserId = securityUtils.getCurrentUserId(userDetails);

    if (currentUserId.equals(id)) return ResponseEntity.badRequest().build();

    userService.forceDeleteUser(id);
    return ResponseEntity.noContent().build();
  }
}
