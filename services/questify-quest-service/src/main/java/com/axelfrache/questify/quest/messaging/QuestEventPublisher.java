package com.axelfrache.questify.quest.messaging;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuestEventPublisher {

  private final RabbitTemplate rabbitTemplate;

  public void publishQuestCompleted(
      UUID userId,
      UUID questId,
      String questTitle,
      int xpEarned,
      String categoryName,
      Instant completedAt) {
    var event =
        new QuestCompletedEvent(userId, questId, questTitle, xpEarned, categoryName, completedAt);
    rabbitTemplate.convertAndSend(
        QueueConstants.EXCHANGE, QueueConstants.QUEST_COMPLETED_ROUTING_KEY, event);
    log.debug(
        "Published QuestCompletedEvent: userId={} questId={} xp={}", userId, questId, xpEarned);
  }
}
