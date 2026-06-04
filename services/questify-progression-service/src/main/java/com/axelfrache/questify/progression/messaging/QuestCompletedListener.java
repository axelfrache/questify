package com.axelfrache.questify.progression.messaging;

import com.axelfrache.questify.progression.service.AchievementService;
import com.axelfrache.questify.progression.service.ProgressionService;
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
public class QuestCompletedListener {

  private final ProgressionService progressionService;
  private final AchievementService achievementService;

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

  @RabbitListener(queues = QueueConstants.QUEST_COMPLETED_QUEUE)
  @Transactional
  public void onQuestCompleted(QuestCompletedEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processQuestCompleted(event);
    }
  }

  @WithSpan("messaging.quest_completed_progression")
  private void processQuestCompleted(QuestCompletedEvent event) {
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
