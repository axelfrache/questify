package com.axelfrache.questify.quest.messaging;

import com.axelfrache.questify.quest.model.OutboxEvent;
import com.axelfrache.questify.quest.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.LocalDate;
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

  public void publishQuestCompleted(
      UUID userId,
      UUID questId,
      String questTitle,
      int xpEarned,
      String categoryName,
      Instant completedAt) {
    var event =
        new QuestCompletedEvent(userId, questId, questTitle, xpEarned, categoryName, completedAt);
    try {
      var outboxEvent =
          OutboxEvent.builder()
              .routingKey(QueueConstants.QUEST_COMPLETED_ROUTING_KEY)
              .payload(objectMapper.writeValueAsString(event))
              .typeId(QuestCompletedEvent.class.getName())
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
}
