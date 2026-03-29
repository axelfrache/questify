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
    var event = new UserDeletedEvent(userId);
    rabbitTemplate.convertAndSend(
        QueueConstants.EXCHANGE, QueueConstants.USER_DELETED_ROUTING_KEY, event);
    log.info("Published UserDeletedEvent for userId={}", userId);
  }

  public void publishUserRegistered(UserRegisteredEvent event) {
    rabbitTemplate.convertAndSend(
        QueueConstants.EXCHANGE, QueueConstants.USER_REGISTERED_ROUTING_KEY, event);
    log.debug("Published UserRegisteredEvent for userId={}", event.userId());
  }
}
