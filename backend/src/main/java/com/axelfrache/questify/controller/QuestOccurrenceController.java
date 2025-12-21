package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.QuestResponse;
import com.axelfrache.questify.service.QuestService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/occurrences")
@RequiredArgsConstructor
public class QuestOccurrenceController {

  private final QuestService questService;

  @PostMapping("/{id}/complete")
  public ResponseEntity<QuestResponse> complete(@PathVariable UUID id) {
    return ResponseEntity.ok(questService.complete(id));
  }

  @PostMapping("/{id}/skip")
  public ResponseEntity<QuestResponse> skip(@PathVariable UUID id) {
    return ResponseEntity.ok(questService.skip(id));
  }
}
