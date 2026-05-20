package com.axelfrache.questify.stats.messaging;

import com.axelfrache.questify.stats.model.QuestCompletionEntry;
import com.axelfrache.questify.stats.repository.QuestCompletionEntryRepository;
import com.axelfrache.questify.stats.service.StatsService;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.util.UUID;
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
  @WithSpan("messaging.quest_completed_stats")
  public void onQuestCompleted(QuestCompletedEvent event) {
    setUuidAttribute("questify.user.id", event.userId());
    setUuidAttribute("questify.quest.id", event.questId());
    Span.current().setAttribute("questify.event.type", "quest.completed");
    Span.current().setAttribute("questify.quest.xp_earned", event.xpEarned());
    Span.current().setAttribute("questify.quest.has_category", event.categoryName() != null);
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
    statsService.invalidateUserStatsCache(event.userId());
  }

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEUE)
  @Transactional
  @WithSpan("messaging.user_deleted_stats")
  public void onUserDeleted(UserDeletedEvent event) {
    setUuidAttribute("questify.user.id", event.userId());
    Span.current().setAttribute("questify.event.type", "user.deleted");
    log.info("Deleting stats for user {}", event.userId());
    repository.deleteByUserId(event.userId());
    statsService.invalidateUserStatsCache(event.userId());
  }

  @RabbitListener(queues = QueueConstants.CATEGORY_DELETED_QUEUE)
  @Transactional
  @WithSpan("messaging.category_deleted_stats")
  public void onCategoryDeleted(CategoryDeletedEvent event) {
    setUuidAttribute("questify.user.id", event.userId());
    Span.current().setAttribute("questify.event.type", "category.deleted");
    log.info(
        "Clearing deleted category from stats: userId={} category={}",
        event.userId(),
        event.categoryName());
    repository.clearCategoryName(event.userId(), event.categoryName());
    statsService.invalidateUserStatsCache(event.userId());
  }

  private static void setUuidAttribute(String key, UUID value) {
    if (value != null) Span.current().setAttribute(key, value.toString());
  }
}
