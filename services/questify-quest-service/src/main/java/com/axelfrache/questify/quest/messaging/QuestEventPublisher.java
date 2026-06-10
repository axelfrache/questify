package com.axelfrache.questify.quest.messaging;

import com.axelfrache.questify.quest.model.OutboxEvent;
import com.axelfrache.questify.quest.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.context.Context;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuestEventPublisher {

  private final OutboxEventRepository outboxEventRepository;
  private final ObjectMapper objectMapper;

  private static String currentTraceparent() {
    Map<String, String> carrier = new HashMap<>();
    GlobalOpenTelemetry.getPropagators()
        .getTextMapPropagator()
        .inject(Context.current(), carrier, Map::put);
    return carrier.get("traceparent");
  }

  public void publishQuestCompleted(
      UUID userId,
      UUID questId,
      String questTitle,
      int xpEarned,
      String categoryName,
      Instant completedAt,
      UUID assigneeId) {
    var event =
        new QuestCompletedEvent(
            userId, questId, questTitle, xpEarned, categoryName, completedAt, assigneeId);
    try {
      var outboxEvent =
          OutboxEvent.builder()
              .routingKey(QueueConstants.QUEST_COMPLETED_ROUTING_KEY)
              .payload(objectMapper.writeValueAsString(event))
              .typeId(QuestCompletedEvent.class.getName())
              .traceparent(currentTraceparent())
              .build();
      outboxEventRepository.save(outboxEvent);
      log.debug(
          "Queued QuestCompletedEvent to outbox: userId={} questId={} xp={}",
          userId,
          questId,
          xpEarned);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to serialize QuestCompletedEvent", e);
    }
  }

  public void publishQuestScheduled(
      UUID userId, UUID templateId, UUID occurrenceId, String questTitle, LocalDate scheduledDate) {
    var event =
        new QuestScheduledEvent(
            userId, templateId, occurrenceId, questTitle, scheduledDate.toString());
    try {
      outboxEventRepository.save(
          OutboxEvent.builder()
              .routingKey(QueueConstants.QUEST_SCHEDULED_ROUTING_KEY)
              .payload(objectMapper.writeValueAsString(event))
              .typeId(QuestScheduledEvent.class.getName())
              .traceparent(currentTraceparent())
              .build());
      log.debug(
          "Queued QuestScheduledEvent to outbox: userId={} occurrenceId={} date={}",
          userId,
          occurrenceId,
          scheduledDate);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to serialize QuestScheduledEvent", e);
    }
  }

  public void publishQuestDeleted(UUID userId, UUID templateId, UUID occurrenceId) {
    var event = new QuestDeletedEvent(userId, templateId, occurrenceId);
    try {
      outboxEventRepository.save(
          OutboxEvent.builder()
              .routingKey(QueueConstants.QUEST_DELETED_ROUTING_KEY)
              .payload(objectMapper.writeValueAsString(event))
              .typeId(QuestDeletedEvent.class.getName())
              .traceparent(currentTraceparent())
              .build());
      log.debug(
          "Queued QuestDeletedEvent to outbox: userId={} templateId={} occurrenceId={}",
          userId,
          templateId,
          occurrenceId);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to serialize QuestDeletedEvent", e);
    }
  }

  public void publishCategoryDeleted(UUID userId, String categoryName) {
    var event = new CategoryDeletedEvent(userId, categoryName);
    try {
      outboxEventRepository.save(
          OutboxEvent.builder()
              .routingKey(QueueConstants.CATEGORY_DELETED_ROUTING_KEY)
              .payload(objectMapper.writeValueAsString(event))
              .typeId(CategoryDeletedEvent.class.getName())
              .traceparent(currentTraceparent())
              .build());
      log.debug(
          "Queued CategoryDeletedEvent to outbox: userId={} category={}", userId, categoryName);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to serialize CategoryDeletedEvent", e);
    }
  }
}
