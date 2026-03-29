package com.axelfrache.questify.auth.messaging;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventPublisher {

  private final RabbitTemplate rabbitTemplate;

  public void publishUserDeleted(UUID userId) {
    try {
      rabbitTemplate.convertAndSend(
          QueueConstants.EXCHANGE, QueueConstants.USER_DELETED_ROUTING_KEY, new UserDeletedEvent(userId));
      log.info("Published UserDeletedEvent for userId={}", userId);
    } catch (Exception e) {
      log.warn("Failed to publish UserDeletedEvent for userId={}: {}", userId, e.getMessage());
    }
  }

  public void publishUserRegistered(UserRegisteredEvent event) {
    try {
      rabbitTemplate.convertAndSend(
          QueueConstants.EXCHANGE, QueueConstants.USER_REGISTERED_ROUTING_KEY, event);
      log.debug("Published UserRegisteredEvent for userId={}", event.userId());
    } catch (Exception e) {
      log.warn("Failed to publish UserRegisteredEvent for userId={}: {}", event.userId(), e.getMessage());
    }
  }
}
