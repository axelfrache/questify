package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.CreateQuestRequest;
import com.axelfrache.questify.dto.QuestResponse;
import com.axelfrache.questify.dto.UpdateQuestRequest;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.repository.UserRepository;
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
  private final UserRepository userRepository;

  @PostMapping
  public ResponseEntity<QuestResponse> create(
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CreateQuestRequest request) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(questService.create(userId, request));
  }

  @GetMapping
  public ResponseEntity<List<QuestResponse>> findAll(
      @AuthenticationPrincipal UserDetails userDetails,
      @RequestParam(required = false) QuestStatus status,
      @RequestParam(required = false) String view) {
    var userId = getUserId(userDetails);

    if ("today".equalsIgnoreCase(view)) {
      return ResponseEntity.ok(questService.findTodayQuests(userId));
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
  public ResponseEntity<QuestResponse> findById(@PathVariable UUID id) {
    return ResponseEntity.ok(questService.findById(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<QuestResponse> update(
      @PathVariable UUID id, @Valid @RequestBody UpdateQuestRequest request) {
    return ResponseEntity.ok(questService.update(id, request));
  }

  @PostMapping("/{id}/complete")
  public ResponseEntity<QuestResponse> complete(@PathVariable UUID id) {
    return ResponseEntity.ok(questService.complete(id));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<QuestResponse> cancel(@PathVariable UUID id) {
    return ResponseEntity.ok(questService.cancel(id));
  }

  @PostMapping("/{id}/toggle-active")
  public ResponseEntity<QuestResponse> toggleActive(@PathVariable UUID id) {
    return ResponseEntity.ok(questService.toggleActive(id));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    questService.delete(id);
    return ResponseEntity.noContent().build();
  }

  private UUID getUserId(UserDetails userDetails) {
    return userRepository
        .findByEmail(userDetails.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("User not found"))
        .getId();
  }
}
