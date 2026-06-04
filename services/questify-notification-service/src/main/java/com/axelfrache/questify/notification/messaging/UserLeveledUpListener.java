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
public class UserLeveledUpListener {

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

  @RabbitListener(queues = QueueConstants.USER_LEVELED_UP_QUEUE)
  @Transactional
  public void onUserLeveledUp(UserLeveledUpEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processUserLeveledUp(event);
    }
  }

  @WithSpan("messaging.user_leveled_up_notification")
  private void processUserLeveledUp(UserLeveledUpEvent event) {
    setEventAttributes("user.leveled_up", event.userId());
    Span.current().setAttribute("questify.progression.level.previous", event.previousLevel());
    Span.current().setAttribute("questify.progression.level.current", event.newLevel());
    Span.current().setAttribute("questify.progression.grade_changed", event.gradeChanged());
    log.debug(
        "Received user.leveled-up: userId={} level={}->{} grade={}",
        event.userId(),
        event.previousLevel(),
        event.newLevel(),
        event.newGradeLabel());

    var body =
        event.gradeChanged()
            ? "Level " + event.newLevel() + " — you reached \"" + event.newGradeLabel() + "\"!"
            : "You reached level " + event.newLevel() + "!";

    notificationService.createAndSendNotification(
        event.userId(), NotificationType.LEVEL_UP, "Level up! 🌟", body, null);
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    if (userId != null) Span.current().setAttribute("questify.user.id", userId.toString());
  }
}
