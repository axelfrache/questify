package com.axelfrache.questify.quest.repository;

import com.axelfrache.questify.quest.model.QuestHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestHistoryRepository extends JpaRepository<QuestHistory, UUID> {

  List<QuestHistory> findByUserIdOrderByCompletedAtDesc(UUID userId);

  void deleteByUserId(UUID userId);
}
