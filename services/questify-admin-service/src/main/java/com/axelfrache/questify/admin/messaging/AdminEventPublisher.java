package com.axelfrache.questify.admin.messaging;

import com.axelfrache.questify.admin.model.OutboxEvent;
import com.axelfrache.questify.admin.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminEventPublisher {

  private final OutboxEventRepository outboxEventRepository;
  private final ObjectMapper objectMapper;

  public void publishUserDeleted(UUID userId) {
    publish(
        QueueConstants.ADMIN_USER_DELETED_ROUTING_KEY,
        new AdminUserDeletedEvent(userId),
        "AdminUserDeletedEvent",
        "userId=" + userId);
  }

  public void publishRoleChanged(UUID userId, String newRole) {
    publish(
        QueueConstants.ADMIN_USER_ROLE_CHANGED_ROUTING_KEY,
        new AdminUserRoleChangedEvent(userId, newRole),
        "AdminUserRoleChangedEvent",
        "userId=" + userId + " role=" + newRole);
  }

  public void publishStatusChanged(UUID userId, boolean enabled) {
    publish(
        QueueConstants.ADMIN_USER_STATUS_CHANGED_ROUTING_KEY,
        new AdminUserStatusChangedEvent(userId, enabled),
        "AdminUserStatusChangedEvent",
        "userId=" + userId + " enabled=" + enabled);
  }

  private void publish(String routingKey, Object payload, String eventName, String context) {
    try {
      var outboxEvent =
          OutboxEvent.builder()
              .routingKey(routingKey)
              .payload(objectMapper.writeValueAsString(payload))
              .typeId(payload.getClass().getName())
              .build();
      outboxEventRepository.save(outboxEvent);
      log.debug("Queued {} to outbox: {}", eventName, context);
    } catch (JsonProcessingException ex) {
      throw new RuntimeException("Failed to serialize " + eventName, ex);
    }
  }
}
