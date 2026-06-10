package com.axelfrache.questify.stats.messaging;

import com.axelfrache.questify.stats.model.QuestCompletionEntry;
import com.axelfrache.questify.stats.repository.QuestCompletionEntryRepository;
import com.axelfrache.questify.stats.service.StatsService;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.propagation.TextMapGetter;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class StatsEventListener {

  private final QuestCompletionEntryRepository repository;
  private final StatsService statsService;

  private static final TextMapGetter<MessageProperties> AMQP_GETTER =
      new TextMapGetter<>() {
        @Override
        public Iterable<String> keys(MessageProperties props) {
          return props.getHeaders().keySet().stream().map(Object::toString).toList();
        }

        @Override
        public String get(MessageProperties props, String key) {
          var v = props.getHeader(key);
          return v == null ? null : v.toString();
        }
      };

  private static Context extractContext(MessageProperties props) {
    return GlobalOpenTelemetry.getPropagators()
        .getTextMapPropagator()
        .extract(Context.current(), props, AMQP_GETTER);
  }

  @RabbitListener(queues = QueueConstants.QUEST_COMPLETED_QUEUE)
  @Transactional
  public void onQuestCompleted(QuestCompletedEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processQuestCompleted(event);
    }
  }

  @WithSpan("messaging.quest_completed_stats")
  private void processQuestCompleted(QuestCompletedEvent event) {
    UUID recipientId = event.assigneeId() != null ? event.assigneeId() : event.userId();
    setUuidAttribute("questify.user.id", recipientId);
    setUuidAttribute("questify.quest.id", event.questId());
    Span.current().setAttribute("questify.event.type", "quest.completed");
    Span.current().setAttribute("questify.quest.xp_earned", event.xpEarned());
    Span.current().setAttribute("questify.quest.has_category", event.categoryName() != null);
    log.debug("Recording completion: questId={} recipient={}", event.questId(), recipientId);
    repository.save(
        QuestCompletionEntry.builder()
            .userId(recipientId)
            .questId(event.questId())
            .questTitle(event.questTitle())
            .xpEarned(event.xpEarned())
            .categoryName(event.categoryName())
            .completedAt(event.completedAt())
            .build());
    statsService.invalidateUserStatsCache(recipientId);
  }

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEUE)
  @Transactional
  public void onUserDeleted(UserDeletedEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processUserDeleted(event);
    }
  }

  @WithSpan("messaging.user_deleted_stats")
  private void processUserDeleted(UserDeletedEvent event) {
    setUuidAttribute("questify.user.id", event.userId());
    Span.current().setAttribute("questify.event.type", "user.deleted");
    log.info("Deleting stats for user {}", event.userId());
    repository.deleteByUserId(event.userId());
    statsService.invalidateUserStatsCache(event.userId());
  }

  @RabbitListener(queues = QueueConstants.CATEGORY_DELETED_QUEUE)
  @Transactional
  public void onCategoryDeleted(CategoryDeletedEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processCategoryDeleted(event);
    }
  }

  @WithSpan("messaging.category_deleted_stats")
  private void processCategoryDeleted(CategoryDeletedEvent event) {
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
