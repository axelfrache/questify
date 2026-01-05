package com.axelfrache.questify.service;

import com.axelfrache.questify.model.QuestHistory;
import com.axelfrache.questify.repository.QuestHistoryRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HistoryService {

  private final QuestHistoryRepository questHistoryRepository;

  @Transactional(readOnly = true)
  public List<QuestHistory> getUserHistory(UUID userId) {
    return questHistoryRepository.findByUserIdOrderByCompletedAtDesc(userId);
  }
}
