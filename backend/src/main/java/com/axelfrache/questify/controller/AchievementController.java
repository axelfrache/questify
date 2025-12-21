package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.AchievementResponse;
import com.axelfrache.questify.repository.UserRepository;
import com.axelfrache.questify.service.AchievementService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

  private final AchievementService achievementService;
  private final UserRepository userRepository;

  @GetMapping
  public ResponseEntity<List<AchievementResponse>> getAll(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(achievementService.getAllAchievements(userId));
  }

  @GetMapping("/unlocked")
  public ResponseEntity<List<AchievementResponse>> getUnlocked(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(achievementService.getUnlockedAchievements(userId));
  }

  private UUID getUserId(UserDetails userDetails) {
    return userRepository
        .findByEmail(userDetails.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("User not found"))
        .getId();
  }
}
