package com.axelfrache.questify.project.messaging;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProjectEventPublisher {

  private final RabbitTemplate rabbitTemplate;

  public void publishProjectDeleted(UUID projectId) {
    try {
      var event = new ProjectDeletedEvent(projectId);
      rabbitTemplate.convertAndSend(QueueConstants.EXCHANGE, QueueConstants.PROJECT_DELETED_ROUTING_KEY, event);
      log.debug("Published ProjectDeletedEvent: projectId={}", projectId);
    } catch (Exception e) {
      log.warn("Failed to publish ProjectDeletedEvent for projectId={} — quest-service will not unlink quests: {}",
          projectId, e.getMessage());
    }
  }
}
