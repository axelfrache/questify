package com.axelfrache.questify.notification.messaging;

import com.axelfrache.questify.notification.model.NotificationType;
import com.axelfrache.questify.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuestCompletedListener {

  private final NotificationService notificationService;

  @RabbitListener(queues = QueueConstants.QUEST_COMPLETED_QUEUE)
  @Transactional
  public void onQuestCompleted(QuestCompletedEvent event) {
    log.debug(
        "Received quest.completed: userId={} quest={} xp={}",
        event.userId(),
        event.questTitle(),
        event.xpEarned());

    notificationService.markReminderCompleted(event.userId(), event.questId());

    notificationService.createAndSendNotification(
        event.userId(),
        NotificationType.QUEST_COMPLETED,
        "Quest completed! 🎉",
        "+" + event.xpEarned() + " XP — \"" + event.questTitle() + "\"",
        event.questId());
  }
}
