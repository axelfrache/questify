package com.axelfrache.questify.quest.messaging;

import com.axelfrache.questify.quest.repository.QuestTemplateRepository;
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
  public void onProjectDeleted(ProjectDeletedEvent event) {
    log.info("Clearing projectId on quests for deleted project {}", event.projectId());
    questTemplateRepository.clearProjectByProjectId(event.projectId());
  }
}
