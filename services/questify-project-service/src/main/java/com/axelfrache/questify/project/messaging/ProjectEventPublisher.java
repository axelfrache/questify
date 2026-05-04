package com.axelfrache.questify.project.messaging;

import com.axelfrache.questify.project.model.OutboxEvent;
import com.axelfrache.questify.project.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProjectEventPublisher {

  private final OutboxEventRepository outboxEventRepository;
  private final ObjectMapper objectMapper;

  public void publishProjectDeleted(UUID projectId) {
    var event = new ProjectDeletedEvent(projectId);
    try {
      var outboxEvent =
          OutboxEvent.builder()
              .routingKey(QueueConstants.PROJECT_DELETED_ROUTING_KEY)
              .payload(objectMapper.writeValueAsString(event))
              .typeId(ProjectDeletedEvent.class.getName())
              .build();
      outboxEventRepository.save(outboxEvent);
      log.debug("Queued ProjectDeletedEvent to outbox: projectId={}", projectId);
    } catch (JsonProcessingException ex) {
      throw new RuntimeException("Failed to serialize ProjectDeletedEvent", ex);
    }
  }
}
