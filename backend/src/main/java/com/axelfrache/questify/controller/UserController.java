package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.ChangePasswordRequest;
import com.axelfrache.questify.dto.UpdateUserRequest;
import com.axelfrache.questify.dto.UserDto;
import com.axelfrache.questify.dto.UserProgressionDto;
import com.axelfrache.questify.service.UserService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/{id}")
  public ResponseEntity<UserDto> getUser(@PathVariable UUID id) {
    return ResponseEntity.ok(userService.getUserById(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<UserDto> updateUser(
      @PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
    return ResponseEntity.ok(userService.updateProfile(id, request));
  }

  @PostMapping("/{id}/password")
  public ResponseEntity<Void> changePassword(
      @PathVariable UUID id, @Valid @RequestBody ChangePasswordRequest request) {
    userService.changePassword(id, request);
    return ResponseEntity.ok().build();
  }

  @GetMapping("/{id}/progression")
  public ResponseEntity<UserProgressionDto> getUserProgression(@PathVariable UUID id) {
    return ResponseEntity.ok(userService.getUserProgression(id));
  }

  @PostMapping(value = "/{id}/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<UserDto> uploadProfilePicture(
      @PathVariable UUID id, @RequestParam("file") MultipartFile file) {
    return ResponseEntity.ok(userService.updateProfilePicture(id, file));
  }

  @DeleteMapping("/{id}/profile-picture")
  public ResponseEntity<UserDto> deleteProfilePicture(@PathVariable UUID id) {
    return ResponseEntity.ok(userService.deleteProfilePicture(id));
  }
}
