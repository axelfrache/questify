package com.axelfrache.questify.notification.messaging;

import com.axelfrache.questify.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuestDeletedListener {

  private final NotificationService notificationService;

  @RabbitListener(queues = QueueConstants.QUEST_DELETED_QUEUE)
  @Transactional
  public void onQuestDeleted(QuestDeletedEvent event) {
    log.debug(
        "Received quest.deleted: userId={} templateId={} occurrenceId={}",
        event.userId(),
        event.templateId(),
        event.occurrenceId());
    notificationService.cleanupRemindersForDeletedQuest(event.templateId(), event.occurrenceId());
  }
}
