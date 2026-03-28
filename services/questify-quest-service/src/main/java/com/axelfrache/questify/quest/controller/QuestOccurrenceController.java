package com.axelfrache.questify.quest.controller;

import com.axelfrache.questify.quest.dto.QuestResponse;
import com.axelfrache.questify.quest.service.QuestService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/occurrences")
@RequiredArgsConstructor
public class QuestOccurrenceController {

  private final QuestService questService;

  @PostMapping("/{id}/complete")
  public ResponseEntity<QuestResponse> complete(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(questService.complete(id, UUID.fromString(userId)));
  }

  @PostMapping("/{id}/skip")
  public ResponseEntity<QuestResponse> skip(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(questService.skip(id, UUID.fromString(userId)));
  }
}
