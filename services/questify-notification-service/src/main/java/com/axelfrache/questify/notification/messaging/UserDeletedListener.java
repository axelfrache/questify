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
public class UserDeletedListener {

  private final NotificationService notificationService;

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEUE)
  @Transactional
  @WithSpan("messaging.user_deleted_notification")
  public void onUserDeleted(UserDeletedEvent event) {
    setEventAttributes("user.deleted", event.userId());
    log.info("Received user.deleted: userId={}", event.userId());
    notificationService.deleteUserData(event.userId());
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    if (userId != null) Span.current().setAttribute("questify.user.id", userId.toString());
  }
}
