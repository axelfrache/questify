package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.DailyStats;
import com.axelfrache.questify.dto.MonthlyStats;
import com.axelfrache.questify.dto.ProgressSummary;
import com.axelfrache.questify.dto.WeeklyStats;
import com.axelfrache.questify.repository.UserRepository;
import com.axelfrache.questify.service.StatsService;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

  private final StatsService statsService;
  private final UserRepository userRepository;

  @GetMapping("/today")
  public ResponseEntity<DailyStats> getToday(@AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(statsService.getDailyStats(userId, LocalDate.now()));
  }

  @GetMapping("/week")
  public ResponseEntity<WeeklyStats> getWeek(@AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(statsService.getWeeklyStats(userId));
  }

  @GetMapping("/month")
  public ResponseEntity<MonthlyStats> getMonth(@AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(statsService.getMonthlyStats(userId));
  }

  @GetMapping("/summary")
  public ResponseEntity<ProgressSummary> getSummary(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(statsService.getProgressSummary(userId));
  }

  @GetMapping("/categories")
  public ResponseEntity<java.util.List<com.axelfrache.questify.dto.CategoryStats>> getCategoryStats(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(statsService.getCategoryStats(userId));
  }

  @GetMapping("/completion-rate")
  public ResponseEntity<com.axelfrache.questify.dto.DailyCompletionRate> getCompletionRate(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(statsService.getDailyCompletionRate(userId, LocalDate.now()));
  }

  @GetMapping("/region-activity")
  public ResponseEntity<java.util.List<com.axelfrache.questify.dto.RegionActivityStats>>
      getRegionActivity(@AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(statsService.getRegionActivityStats(userId));
  }

  @GetMapping("/weekly-completion")
  public ResponseEntity<java.util.List<com.axelfrache.questify.dto.DailyCompletionRate>>
      getWeeklyCompletionRates(@AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(statsService.getWeeklyCompletionRates(userId));
  }

  private UUID getUserId(UserDetails userDetails) {
    return userRepository
        .findByEmail(userDetails.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("User not found"))
        .getId();
  }
}
