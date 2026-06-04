package com.axelfrache.questify.quest.messaging;

import com.axelfrache.questify.quest.repository.CategoryRepository;
import com.axelfrache.questify.quest.repository.QuestHistoryRepository;
import com.axelfrache.questify.quest.repository.QuestTemplateRepository;
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
public class UserDeletedListener {

  private final QuestTemplateRepository questTemplateRepository;
  private final QuestHistoryRepository questHistoryRepository;
  private final CategoryRepository categoryRepository;

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

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEST_QUEUE)
  @Transactional
  public void onUserDeleted(UserDeletedEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processUserDeleted(event);
    }
  }

  @WithSpan("messaging.user_deleted_quest")
  private void processUserDeleted(UserDeletedEvent event) {
    var userId = event.userId();
    setEventAttributes("user.deleted", userId);
    log.info("Cleaning up quest data for deleted user: {}", userId);

    questTemplateRepository.deleteByUserId(userId);
    questHistoryRepository.deleteByUserId(userId);
    categoryRepository.deleteByUserId(userId);

    log.info("Quest data cleanup complete for user: {}", userId);
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    if (userId != null) Span.current().setAttribute("questify.user.id", userId.toString());
  }
}
