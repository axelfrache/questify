package com.axelfrache.questify.progression.controller;

import com.axelfrache.questify.progression.dto.AchievementResponse;
import com.axelfrache.questify.progression.service.AchievementService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

  private final AchievementService achievementService;

  @GetMapping
  public ResponseEntity<List<AchievementResponse>> getAll(
      @AuthenticationPrincipal String userId) {
    return ResponseEntity.ok(achievementService.getAllAchievements(UUID.fromString(userId)));
  }

  @GetMapping("/unlocked")
  public ResponseEntity<List<AchievementResponse>> getUnlocked(
      @AuthenticationPrincipal String userId) {
    return ResponseEntity.ok(achievementService.getUnlockedAchievements(UUID.fromString(userId)));
  }
}
