package com.axelfrache.questify.stats.messaging;

import com.axelfrache.questify.stats.model.QuestCompletionEntry;
import com.axelfrache.questify.stats.repository.QuestCompletionEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class StatsEventListener {

  private final QuestCompletionEntryRepository repository;

  @RabbitListener(queues = QueueConstants.QUEST_COMPLETED_QUEUE)
  @Transactional
  public void onQuestCompleted(QuestCompletedEvent event) {
    log.debug("Recording completion: questId={} userId={}", event.questId(), event.userId());
    repository.save(
        QuestCompletionEntry.builder()
            .userId(event.userId())
            .questId(event.questId())
            .questTitle(event.questTitle())
            .xpEarned(event.xpEarned())
            .categoryName(event.categoryName())
            .completedAt(event.completedAt())
            .build());
  }

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEUE)
  @Transactional
  public void onUserDeleted(UserDeletedEvent event) {
    log.info("Deleting stats for user {}", event.userId());
    repository.deleteByUserId(event.userId());
  }
}
