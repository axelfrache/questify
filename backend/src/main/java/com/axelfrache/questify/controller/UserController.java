package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.ChangePasswordRequest;
import com.axelfrache.questify.dto.DeleteAccountRequest;
import com.axelfrache.questify.dto.UpdateUserRequest;
import com.axelfrache.questify.dto.UserDto;
import com.axelfrache.questify.dto.UserProgressionDto;
import com.axelfrache.questify.security.SecurityUtils;
import com.axelfrache.questify.service.UserService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;
  private final SecurityUtils securityUtils;

  @GetMapping("/{id}")
  public ResponseEntity<UserDto> getUser(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    securityUtils.validateOwnership(userDetails, id);
    return ResponseEntity.ok(userService.getUserById(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<UserDto> updateUser(
      @AuthenticationPrincipal UserDetails userDetails,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateUserRequest request) {
    securityUtils.validateOwnership(userDetails, id);
    return ResponseEntity.ok(userService.updateProfile(id, request));
  }

  @PostMapping("/{id}/password")
  public ResponseEntity<Void> changePassword(
      @AuthenticationPrincipal UserDetails userDetails,
      @PathVariable UUID id,
      @Valid @RequestBody ChangePasswordRequest request) {
    securityUtils.validateOwnership(userDetails, id);
    userService.changePassword(id, request);
    return ResponseEntity.ok().build();
  }

  @GetMapping("/{id}/progression")
  public ResponseEntity<UserProgressionDto> getUserProgression(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    securityUtils.validateOwnership(userDetails, id);
    return ResponseEntity.ok(userService.getUserProgression(id));
  }

  @PostMapping(value = "/{id}/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<UserDto> uploadProfilePicture(
      @AuthenticationPrincipal UserDetails userDetails,
      @PathVariable UUID id,
      @RequestParam("file") MultipartFile file) {
    securityUtils.validateOwnership(userDetails, id);
    return ResponseEntity.ok(userService.updateProfilePicture(id, file));
  }

  @DeleteMapping("/{id}/profile-picture")
  public ResponseEntity<UserDto> deleteProfilePicture(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    securityUtils.validateOwnership(userDetails, id);
    return ResponseEntity.ok(userService.deleteProfilePicture(id));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteAccount(
      @AuthenticationPrincipal UserDetails userDetails,
      @PathVariable UUID id,
      @Valid @RequestBody DeleteAccountRequest request) {
    securityUtils.validateOwnership(userDetails, id);
    userService.deleteAccount(id, request.password());
    return ResponseEntity.noContent().build();
  }
}
