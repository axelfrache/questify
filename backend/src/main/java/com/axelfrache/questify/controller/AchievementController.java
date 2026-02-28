package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.AchievementResponse;
import com.axelfrache.questify.security.SecurityUtils;
import com.axelfrache.questify.service.AchievementService;
import java.util.List;
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
  private final SecurityUtils securityUtils;

  @GetMapping
  public ResponseEntity<List<AchievementResponse>> getAll(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(achievementService.getAllAchievements(userId));
  }

  @GetMapping("/unlocked")
  public ResponseEntity<List<AchievementResponse>> getUnlocked(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(achievementService.getUnlockedAchievements(userId));
  }
}
