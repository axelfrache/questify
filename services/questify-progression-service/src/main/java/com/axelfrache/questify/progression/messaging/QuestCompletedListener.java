package com.axelfrache.questify.progression.messaging;

import com.axelfrache.questify.progression.service.AchievementService;
import com.axelfrache.questify.progression.service.ProgressionService;
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
public class QuestCompletedListener {

  private final ProgressionService progressionService;
  private final AchievementService achievementService;

  @RabbitListener(queues = QueueConstants.QUEST_COMPLETED_QUEUE)
  @Transactional
  @WithSpan("messaging.quest_completed_progression")
  public void onQuestCompleted(QuestCompletedEvent event) {
    setEventAttributes("quest.completed", event.userId());
    setUuidAttribute("questify.quest.id", event.questId());
    Span.current().setAttribute("questify.quest.xp_earned", event.xpEarned());
    Span.current().setAttribute("questify.quest.has_category", event.categoryName() != null);
    log.debug("Received QuestCompletedEvent: userId={} xp={}", event.userId(), event.xpEarned());
    progressionService.awardXp(
        event.userId(),
        event.xpEarned(),
        event.questId(),
        event.categoryName(),
        event.completedAt());
    achievementService.evaluateAndUnlockAchievements(event.userId());
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    setUuidAttribute("questify.user.id", userId);
  }

  private static void setUuidAttribute(String key, UUID value) {
    if (value != null) Span.current().setAttribute(key, value.toString());
  }
}
