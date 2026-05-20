package com.axelfrache.questify.project.messaging;

import com.axelfrache.questify.project.repository.ProjectMemberRepository;
import com.axelfrache.questify.project.repository.ProjectRepository;
import com.axelfrache.questify.project.repository.UserProjectPinRepository;
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
public class UserDeletedListener {

  private final UserProjectPinRepository userProjectPinRepository;
  private final ProjectMemberRepository projectMemberRepository;
  private final ProjectRepository projectRepository;

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEUE)
  @Transactional
  @WithSpan("messaging.user_deleted_project")
  public void onUserDeleted(UserDeletedEvent event) {
    setEventAttributes("user.deleted", event.userId());
    log.info("Deleting project data for user {}", event.userId());
    userProjectPinRepository.deleteByUserId(event.userId());
    projectMemberRepository.deleteByUserId(event.userId());
    var ownedProjects = projectRepository.findByOwnerUserId(event.userId());
    if (!ownedProjects.isEmpty()) {
      Span.current().setAttribute("questify.project.owned_count", ownedProjects.size());
      userProjectPinRepository.deleteByProjectIn(ownedProjects);
      projectMemberRepository.deleteByProjectIn(ownedProjects);
      projectRepository.deleteAll(ownedProjects);
    }
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    if (userId != null) Span.current().setAttribute("questify.user.id", userId.toString());
  }
}
