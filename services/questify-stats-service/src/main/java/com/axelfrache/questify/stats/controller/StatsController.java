package com.axelfrache.questify.stats.controller;

import com.axelfrache.questify.stats.dto.CategoryStatsResponse;
import com.axelfrache.questify.stats.dto.DailyStatsResponse;
import com.axelfrache.questify.stats.dto.OverallStatsResponse;
import com.axelfrache.questify.stats.dto.QuestHistoryResponse;
import com.axelfrache.questify.stats.service.StatsService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@Validated
public class StatsController {

  private final StatsService statsService;

  @GetMapping("/overview")
  public ResponseEntity<OverallStatsResponse> getOverview(
      @AuthenticationPrincipal String userId) {
    return ResponseEntity.ok(statsService.getOverallStats(UUID.fromString(userId)));
  }

  @GetMapping("/history")
  public ResponseEntity<Page<QuestHistoryResponse>> getHistory(
      @AuthenticationPrincipal String userId,
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
    return ResponseEntity.ok(statsService.getHistory(UUID.fromString(userId), page, size));
  }

  @GetMapping("/categories")
  public ResponseEntity<List<CategoryStatsResponse>> getCategoryStats(
      @AuthenticationPrincipal String userId) {
    return ResponseEntity.ok(statsService.getCategoryStats(UUID.fromString(userId)));
  }

  @GetMapping("/daily")
  public ResponseEntity<List<DailyStatsResponse>> getDailyStats(
      @AuthenticationPrincipal String userId,
      @RequestParam(defaultValue = "30") @Min(1) @Max(365) int days) {
    return ResponseEntity.ok(statsService.getDailyStats(UUID.fromString(userId), days));
  }
}
