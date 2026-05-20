package com.axelfrache.questify.notification.messaging;

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
public class QuestDeletedListener {

  private final NotificationService notificationService;

  @RabbitListener(queues = QueueConstants.QUEST_DELETED_QUEUE)
  @Transactional
  @WithSpan("messaging.quest_deleted_notification")
  public void onQuestDeleted(QuestDeletedEvent event) {
    setEventAttributes("quest.deleted", event.userId());
    setUuidAttribute("questify.quest.id", event.templateId());
    setUuidAttribute("questify.quest.occurrence.id", event.occurrenceId());
    log.debug(
        "Received quest.deleted: userId={} templateId={} occurrenceId={}",
        event.userId(),
        event.templateId(),
        event.occurrenceId());
    notificationService.cleanupRemindersForDeletedQuest(event.templateId(), event.occurrenceId());
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    setUuidAttribute("questify.user.id", userId);
  }

  private static void setUuidAttribute(String key, UUID value) {
    if (value != null) Span.current().setAttribute(key, value.toString());
  }
}
