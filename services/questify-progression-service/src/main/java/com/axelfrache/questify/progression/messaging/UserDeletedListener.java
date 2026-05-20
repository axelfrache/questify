package com.axelfrache.questify.progression.messaging;

import com.axelfrache.questify.progression.repository.QuestCompletionRecordRepository;
import com.axelfrache.questify.progression.repository.UserAchievementRepository;
import com.axelfrache.questify.progression.repository.UserProgressionRepository;
import com.axelfrache.questify.progression.service.ProgressionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserDeletedListener {

  private final UserProgressionRepository userProgressionRepository;
  private final UserAchievementRepository userAchievementRepository;
  private final QuestCompletionRecordRepository questCompletionRecordRepository;
  private final ProgressionService progressionService;

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEUE)
  @Transactional
  public void onUserDeleted(UserDeletedEvent event) {
    log.info("Deleting progression data for user {}", event.userId());
    questCompletionRecordRepository.deleteByUserId(event.userId());
    userAchievementRepository.deleteByUserId(event.userId());
    userProgressionRepository.deleteByUserId(event.userId());
    progressionService.invalidateUserProgressionCache(event.userId());
  }
}
