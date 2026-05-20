package com.axelfrache.questify.notification.messaging;

import com.axelfrache.questify.notification.model.NotificationType;
import com.axelfrache.questify.notification.service.NotificationService;
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

  private final NotificationService notificationService;

  @RabbitListener(queues = QueueConstants.QUEST_COMPLETED_QUEUE)
  @Transactional
  @WithSpan("messaging.quest_completed_notification")
  public void onQuestCompleted(QuestCompletedEvent event) {
    setEventAttributes("quest.completed", event.userId());
    setUuidAttribute("questify.quest.id", event.questId());
    Span.current().setAttribute("questify.quest.xp_earned", event.xpEarned());
    log.debug(
        "Received quest.completed: userId={} quest={} xp={}",
        event.userId(),
        event.questTitle(),
        event.xpEarned());

    notificationService.markReminderCompleted(event.userId(), event.questId());

    notificationService.createAndSendNotification(
        event.userId(),
        NotificationType.QUEST_COMPLETED,
        "Quest completed! 🎉",
        "+" + event.xpEarned() + " XP — \"" + event.questTitle() + "\"",
        event.questId());
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    setUuidAttribute("questify.user.id", userId);
  }

  private static void setUuidAttribute(String key, UUID value) {
    if (value != null) Span.current().setAttribute(key, value.toString());
  }
}
