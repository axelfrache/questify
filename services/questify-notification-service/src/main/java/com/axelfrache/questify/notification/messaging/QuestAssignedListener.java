package com.axelfrache.questify.notification.messaging;

import com.axelfrache.questify.notification.model.NotificationType;
import com.axelfrache.questify.notification.service.NotificationService;
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
public class QuestAssignedListener {

  private final NotificationService notificationService;

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

  @RabbitListener(queues = QueueConstants.QUEST_ASSIGNED_QUEUE)
  @Transactional
  public void onQuestAssigned(QuestAssignedEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processQuestAssigned(event);
    }
  }

  @WithSpan("messaging.quest_assigned_notification")
  private void processQuestAssigned(QuestAssignedEvent event) {
    if (event.assigneeId() == null) {
      log.warn("Received quest.assigned without assigneeId, ignoring.");
      return;
    }
    setEventAttributes("quest.assigned", event.assigneeId());
    setUuidAttribute("questify.quest.id", event.questId());
    log.debug(
        "Received quest.assigned: assignee={} quest={}", event.assigneeId(), event.questTitle());

    notificationService.createAndSendNotification(
        event.assigneeId(),
        NotificationType.QUEST_ASSIGNED,
        "New quest assigned to you 🎯",
        "\"" + event.questTitle() + "\"",
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
