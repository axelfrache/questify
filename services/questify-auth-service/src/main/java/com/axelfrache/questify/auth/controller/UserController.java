package com.axelfrache.questify.auth.controller;

import com.axelfrache.questify.auth.dto.ChangePasswordRequest;
import com.axelfrache.questify.auth.dto.DeleteAccountRequest;
import com.axelfrache.questify.auth.dto.PublicUserResponse;
import com.axelfrache.questify.auth.dto.UpdateUserRequest;
import com.axelfrache.questify.auth.dto.UserDto;
import com.axelfrache.questify.auth.security.SecurityUtils;
import com.axelfrache.questify.auth.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;
  private final SecurityUtils securityUtils;

  @GetMapping("/{id}")
  public ResponseEntity<UserDto> getUser(Authentication authentication, @PathVariable UUID id) {
    securityUtils.validateOwnership(authentication, id);
    return ResponseEntity.ok(userService.getUserById(id));
  }

  @GetMapping("/summaries")
  public ResponseEntity<List<PublicUserResponse>> getUserSummaries(@RequestParam List<UUID> ids) {
    if (ids.size() > 100) throw new IllegalArgumentException("Too many ids requested");
    return ResponseEntity.ok(userService.getPublicUsers(ids));
  }

  @PutMapping("/{id}")
  public ResponseEntity<UserDto> updateUser(
      Authentication authentication,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateUserRequest request) {
    securityUtils.validateOwnership(authentication, id);
    return ResponseEntity.ok(userService.updateProfile(id, request));
  }

  @PostMapping("/{id}/password")
  public ResponseEntity<Void> changePassword(
      Authentication authentication,
      @PathVariable UUID id,
      @Valid @RequestBody ChangePasswordRequest request) {
    securityUtils.validateOwnership(authentication, id);
    userService.changePassword(id, request);
    return ResponseEntity.ok().build();
  }

  @PostMapping(value = "/{id}/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<UserDto> uploadProfilePicture(
      Authentication authentication,
      @PathVariable UUID id,
      @RequestParam("file") MultipartFile file) {
    securityUtils.validateOwnership(authentication, id);
    return ResponseEntity.ok(userService.updateProfilePicture(id, file));
  }

  @DeleteMapping("/{id}/profile-picture")
  public ResponseEntity<UserDto> deleteProfilePicture(
      Authentication authentication, @PathVariable UUID id) {
    securityUtils.validateOwnership(authentication, id);
    return ResponseEntity.ok(userService.deleteProfilePicture(id));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteAccount(
      Authentication authentication,
      @PathVariable UUID id,
      @Valid @RequestBody DeleteAccountRequest request) {
    securityUtils.validateOwnership(authentication, id);
    userService.deleteAccount(id, request.password());
    return ResponseEntity.noContent().build();
  }
}
