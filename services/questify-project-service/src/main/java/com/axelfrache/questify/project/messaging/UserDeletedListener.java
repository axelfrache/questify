package com.axelfrache.questify.project.messaging;

import com.axelfrache.questify.project.repository.ProjectMemberRepository;
import com.axelfrache.questify.project.repository.ProjectRepository;
import com.axelfrache.questify.project.repository.UserProjectPinRepository;
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
  public void onUserDeleted(UserDeletedEvent event) {
    log.info("Deleting project data for user {}", event.userId());
    userProjectPinRepository.deleteByUserId(event.userId());
    projectMemberRepository.deleteByUserId(event.userId());
    var ownedProjects = projectRepository.findByOwnerUserId(event.userId());
    if (!ownedProjects.isEmpty()) {
      userProjectPinRepository.deleteByProjectIn(ownedProjects);
      projectMemberRepository.deleteByProjectIn(ownedProjects);
      projectRepository.deleteAll(ownedProjects);
    }
  }
}
