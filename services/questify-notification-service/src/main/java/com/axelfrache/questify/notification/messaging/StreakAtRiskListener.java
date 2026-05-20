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
public class StreakAtRiskListener {

  private final NotificationService notificationService;

  @RabbitListener(queues = QueueConstants.STREAK_AT_RISK_QUEUE)
  @Transactional
  @WithSpan("messaging.streak_at_risk_notification")
  public void onStreakAtRisk(StreakAtRiskEvent event) {
    setEventAttributes("user.streak_at_risk", event.userId());
    log.debug("Received user.streak-at-risk: userId={}", event.userId());

    notificationService.createAndSendNotification(
        event.userId(),
        NotificationType.STREAK_AT_RISK,
        "Your streak is at risk! 🔥",
        "Complete a quest today before midnight to keep your streak alive.",
        null);
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    if (userId != null) Span.current().setAttribute("questify.user.id", userId.toString());
  }
}
