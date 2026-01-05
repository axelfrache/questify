package com.axelfrache.questify.controller;

import com.axelfrache.questify.model.QuestHistory;
import com.axelfrache.questify.repository.UserRepository;
import com.axelfrache.questify.service.HistoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

  private final HistoryService historyService;
  private final UserRepository userRepository;

  @GetMapping
  public List<QuestHistory> getHistory(@AuthenticationPrincipal UserDetails userDetails) {
    var userId =
        userRepository
            .findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("User not found"))
            .getId();
    return historyService.getUserHistory(userId);
  }
}
