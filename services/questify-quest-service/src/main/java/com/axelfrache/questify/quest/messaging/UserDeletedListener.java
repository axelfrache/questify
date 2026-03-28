package com.axelfrache.questify.quest.messaging;

import com.axelfrache.questify.quest.repository.CategoryRepository;
import com.axelfrache.questify.quest.repository.QuestHistoryRepository;
import com.axelfrache.questify.quest.repository.QuestTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserDeletedListener {

  private final QuestTemplateRepository questTemplateRepository;
  private final QuestHistoryRepository questHistoryRepository;
  private final CategoryRepository categoryRepository;

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEST_QUEUE)
  @Transactional
  public void onUserDeleted(UserDeletedEvent event) {
    var userId = event.userId();
    log.info("Cleaning up quest data for deleted user: {}", userId);

    questTemplateRepository.deleteByUserId(userId);
    questHistoryRepository.deleteByUserId(userId);
    categoryRepository.deleteByUserId(userId);

    log.info("Quest data cleanup complete for user: {}", userId);
  }
}
