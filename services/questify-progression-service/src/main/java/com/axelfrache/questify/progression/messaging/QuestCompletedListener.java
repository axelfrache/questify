package com.axelfrache.questify.progression.messaging;

import com.axelfrache.questify.progression.service.AchievementService;
import com.axelfrache.questify.progression.service.ProgressionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuestCompletedListener {

  private final ProgressionService progressionService;
  private final AchievementService achievementService;

  @RabbitListener(queues = QueueConstants.QUEST_COMPLETED_QUEUE)
  @Transactional
  public void onQuestCompleted(QuestCompletedEvent event) {
    log.debug("Received QuestCompletedEvent: userId={} xp={}", event.userId(), event.xpEarned());
    progressionService.awardXp(event.userId(), event.xpEarned(), event.questId(),
        event.categoryName(), event.completedAt());
    achievementService.checkAndUnlock(event.userId());
  }
}
