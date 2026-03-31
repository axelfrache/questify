package com.axelfrache.questify.quest.controller;

import com.axelfrache.questify.quest.dto.CreateQuestRequest;
import com.axelfrache.questify.quest.dto.QuestResponse;
import com.axelfrache.questify.quest.dto.UpdateQuestRequest;
import com.axelfrache.questify.quest.model.QuestStatus;
import com.axelfrache.questify.quest.service.QuestService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
public class QuestController {

  private final QuestService questService;

  @PostMapping
  public ResponseEntity<QuestResponse> create(
      @AuthenticationPrincipal String userId, @Valid @RequestBody CreateQuestRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(questService.create(UUID.fromString(userId), request));
  }

  @GetMapping
  public ResponseEntity<List<QuestResponse>> findAll(
      @AuthenticationPrincipal String userId,
      @RequestParam(required = false) QuestStatus status,
      @RequestParam(required = false) String view,
      @RequestParam(required = false) UUID projectId) {
    var uid = UUID.fromString(userId);

    if (projectId != null) return ResponseEntity.ok(questService.findByProject(projectId, uid));
    return switch (view != null ? view.toLowerCase() : "") {
      case "today" -> ResponseEntity.ok(questService.findTodayQuests(uid));
      case "inbox" -> ResponseEntity.ok(questService.findInboxQuests(uid));
      case "upcoming" -> ResponseEntity.ok(questService.findUpcomingQuests(uid));
      case "recurring" -> ResponseEntity.ok(questService.findRecurringTemplates(uid));
      default ->
          status != null
              ? ResponseEntity.ok(questService.findByUserAndStatus(uid, status))
              : ResponseEntity.ok(questService.findByUser(uid));
    };
  }

  @GetMapping("/{id}")
  public ResponseEntity<QuestResponse> findById(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(questService.findById(id, UUID.fromString(userId)));
  }

  @PutMapping("/{id}")
  public ResponseEntity<QuestResponse> update(
      @AuthenticationPrincipal String userId,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateQuestRequest request) {
    return ResponseEntity.ok(questService.update(id, UUID.fromString(userId), request));
  }

  @PostMapping("/{id}/complete")
  public ResponseEntity<QuestResponse> complete(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(questService.complete(id, UUID.fromString(userId)));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<QuestResponse> cancel(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(questService.cancel(id, UUID.fromString(userId)));
  }

  @PostMapping("/{id}/toggle-active")
  public ResponseEntity<QuestResponse> toggleActive(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(questService.toggleActive(id, UUID.fromString(userId)));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    questService.delete(id, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/subquests")
  public ResponseEntity<List<QuestResponse>> findSubquests(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(questService.findSubquests(id, UUID.fromString(userId)));
  }
}
