package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.CreateQuestRequest;
import com.axelfrache.questify.dto.QuestResponse;
import com.axelfrache.questify.dto.UpdateQuestRequest;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.security.SecurityUtils;
import com.axelfrache.questify.service.QuestService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
public class QuestController {

  private final QuestService questService;
  private final SecurityUtils securityUtils;

  @PostMapping
  public ResponseEntity<QuestResponse> create(
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CreateQuestRequest request) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(questService.create(userId, request));
  }

  @GetMapping
  public ResponseEntity<List<QuestResponse>> findAll(
      @AuthenticationPrincipal UserDetails userDetails,
      @RequestParam(required = false) QuestStatus status,
      @RequestParam(required = false) String view) {
    var userId = securityUtils.getCurrentUserId(userDetails);

    if ("today".equalsIgnoreCase(view)) {
      return ResponseEntity.ok(questService.findTodayQuests(userId));
    }

    if ("inbox".equalsIgnoreCase(view)) {
      return ResponseEntity.ok(questService.findInboxQuests(userId));
    }

    if ("upcoming".equalsIgnoreCase(view)) {
      return ResponseEntity.ok(questService.findUpcomingQuests(userId));
    }

    if ("recurring".equalsIgnoreCase(view)) {
      return ResponseEntity.ok(questService.findRecurringTemplates(userId));
    }

    if (status != null) return ResponseEntity.ok(questService.findByUserAndStatus(userId, status));

    return ResponseEntity.ok(questService.findByUser(userId));
  }

  @GetMapping("/{id}")
  public ResponseEntity<QuestResponse> findById(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(questService.findById(id, userId));
  }

  @PutMapping("/{id}")
  public ResponseEntity<QuestResponse> update(
      @AuthenticationPrincipal UserDetails userDetails,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateQuestRequest request) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(questService.update(id, userId, request));
  }

  @PostMapping("/{id}/complete")
  public ResponseEntity<QuestResponse> complete(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(questService.complete(id, userId));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<QuestResponse> cancel(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(questService.cancel(id, userId));
  }

  @PostMapping("/{id}/toggle-active")
  public ResponseEntity<QuestResponse> toggleActive(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(questService.toggleActive(id, userId));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    questService.delete(id, userId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/subquests")
  public ResponseEntity<List<QuestResponse>> findSubquests(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(questService.findSubquests(id, userId));
  }
}
