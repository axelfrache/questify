package com.axelfrache.questify.auth.messaging;

import com.axelfrache.questify.auth.model.OutboxEvent;
import com.axelfrache.questify.auth.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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

  private void queue(String routingKey, Object payload, String eventName) {
    try {
      var outboxEvent =
          OutboxEvent.builder()
              .routingKey(routingKey)
              .payload(objectMapper.writeValueAsString(payload))
              .typeId(payload.getClass().getName())
              .build();
      outboxEventRepository.save(outboxEvent);
      log.debug("Queued {} to outbox", eventName);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to serialize " + eventName, e);
    }
  }
}
