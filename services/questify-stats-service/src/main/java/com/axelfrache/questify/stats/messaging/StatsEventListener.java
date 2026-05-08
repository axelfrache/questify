package com.axelfrache.questify.stats.messaging;

import com.axelfrache.questify.stats.model.QuestCompletionEntry;
import com.axelfrache.questify.stats.repository.QuestCompletionEntryRepository;
import com.axelfrache.questify.stats.service.StatsService;
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
  private final StatsService statsService;

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
    statsService.evictUserCache(event.userId());
  }

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEUE)
  @Transactional
  public void onUserDeleted(UserDeletedEvent event) {
    log.info("Deleting stats for user {}", event.userId());
    repository.deleteByUserId(event.userId());
    statsService.evictUserCache(event.userId());
  }

  @RabbitListener(queues = QueueConstants.CATEGORY_DELETED_QUEUE)
  @Transactional
  public void onCategoryDeleted(CategoryDeletedEvent event) {
    log.info(
        "Clearing deleted category from stats: userId={} category={}",
        event.userId(),
        event.categoryName());
    repository.clearCategoryName(event.userId(), event.categoryName());
    statsService.evictUserCache(event.userId());
  }
}
