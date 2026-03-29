package com.axelfrache.questify.admin.messaging;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminEventPublisher {

  private final RabbitTemplate rabbitTemplate;

  public void publishUserDeleted(UUID userId) {
    try {
      rabbitTemplate.convertAndSend(
          QueueConstants.EXCHANGE, QueueConstants.ADMIN_USER_DELETED_ROUTING_KEY,
          new AdminUserDeletedEvent(userId));
      log.info("Published AdminUserDeletedEvent for userId={}", userId);
    } catch (Exception e) {
      log.warn("Failed to publish AdminUserDeletedEvent for userId={}: {}", userId, e.getMessage());
    }
  }

  public void publishRoleChanged(UUID userId, String newRole) {
    try {
      rabbitTemplate.convertAndSend(
          QueueConstants.EXCHANGE, QueueConstants.ADMIN_USER_ROLE_CHANGED_ROUTING_KEY,
          new AdminUserRoleChangedEvent(userId, newRole));
      log.debug("Published AdminUserRoleChangedEvent: userId={} role={}", userId, newRole);
    } catch (Exception e) {
      log.warn("Failed to publish AdminUserRoleChangedEvent for userId={}: {}", userId, e.getMessage());
    }
  }

  public void publishStatusChanged(UUID userId, boolean enabled) {
    try {
      rabbitTemplate.convertAndSend(
          QueueConstants.EXCHANGE, QueueConstants.ADMIN_USER_STATUS_CHANGED_ROUTING_KEY,
          new AdminUserStatusChangedEvent(userId, enabled));
      log.debug("Published AdminUserStatusChangedEvent: userId={} enabled={}", userId, enabled);
    } catch (Exception e) {
      log.warn("Failed to publish AdminUserStatusChangedEvent for userId={}: {}", userId, e.getMessage());
    }
  }
}
