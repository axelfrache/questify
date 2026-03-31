package com.axelfrache.questify.progression.controller;

import com.axelfrache.questify.progression.dto.ProgressionResponse;
import com.axelfrache.questify.progression.service.ProgressionService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progression")
@RequiredArgsConstructor
public class ProgressionController {

  private final ProgressionService progressionService;

  @GetMapping
  public ResponseEntity<ProgressionResponse> getProgression(
      @AuthenticationPrincipal String userId) {
    return ResponseEntity.ok(progressionService.getProgression(UUID.fromString(userId)));
  }
}
