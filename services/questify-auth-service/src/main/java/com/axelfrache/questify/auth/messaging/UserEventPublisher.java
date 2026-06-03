package com.axelfrache.questify.auth.messaging;

import com.axelfrache.questify.auth.model.OutboxEvent;
import com.axelfrache.questify.auth.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.context.Context;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventPublisher {

  private final OutboxEventRepository outboxEventRepository;
  private final ObjectMapper objectMapper;

  public void publishUserDeleted(UUID userId) {
    queue(
        QueueConstants.USER_DELETED_ROUTING_KEY, new UserDeletedEvent(userId), "UserDeletedEvent");
  }

  public void publishUserRegistered(UserRegisteredEvent event) {
    queue(QueueConstants.USER_REGISTERED_ROUTING_KEY, event, "UserRegisteredEvent");
  }

  private static String currentTraceparent() {
    Map<String, String> carrier = new HashMap<>();
    GlobalOpenTelemetry.getPropagators()
        .getTextMapPropagator()
        .inject(Context.current(), carrier, Map::put);
    return carrier.get("traceparent");
  }

  private void queue(String routingKey, Object payload, String eventName) {
    try {
      var outboxEvent =
          OutboxEvent.builder()
              .routingKey(routingKey)
              .payload(objectMapper.writeValueAsString(payload))
              .typeId(payload.getClass().getName())
              .traceparent(currentTraceparent())
              .build();
      outboxEventRepository.save(outboxEvent);
      log.debug("Queued {} to outbox", eventName);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to serialize " + eventName, e);
    }
  }
}
