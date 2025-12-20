package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.UserDto;
import com.axelfrache.questify.dto.UserProgressionDto;
import com.axelfrache.questify.service.UserService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/{id}")
  public ResponseEntity<UserDto> getUser(@PathVariable UUID id) {
    return ResponseEntity.ok(userService.getUserById(id));
  }

  @GetMapping("/{id}/progression")
  public ResponseEntity<UserProgressionDto> getUserProgression(@PathVariable UUID id) {
    return ResponseEntity.ok(userService.getUserProgression(id));
  }
}
