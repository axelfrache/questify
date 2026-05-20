package com.axelfrache.questify.quest.messaging;

import com.axelfrache.questify.quest.repository.QuestTemplateRepository;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProjectDeletedListener {

  private final QuestTemplateRepository questTemplateRepository;

  @RabbitListener(queues = QueueConstants.PROJECT_DELETED_QUEUE)
  @Transactional
  @WithSpan("messaging.project_deleted_quest")
  public void onProjectDeleted(ProjectDeletedEvent event) {
    setEventAttributes("project.deleted", event.projectId());
    log.info("Clearing projectId on quests for deleted project {}", event.projectId());
    questTemplateRepository.clearProjectByProjectId(event.projectId());
  }

  private static void setEventAttributes(String eventType, UUID projectId) {
    Span.current().setAttribute("questify.event.type", eventType);
    if (projectId != null) Span.current().setAttribute("questify.project.id", projectId.toString());
  }
}
