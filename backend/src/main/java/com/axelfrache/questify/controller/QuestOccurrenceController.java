package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.QuestResponse;
import com.axelfrache.questify.security.SecurityUtils;
import com.axelfrache.questify.service.QuestService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/occurrences")
@RequiredArgsConstructor
public class QuestOccurrenceController {

  private final QuestService questService;
  private final SecurityUtils securityUtils;

  @PostMapping("/{id}/complete")
  public ResponseEntity<QuestResponse> complete(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(questService.complete(id, userId));
  }

  @PostMapping("/{id}/skip")
  public ResponseEntity<QuestResponse> skip(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(questService.skip(id, userId));
  }
}
