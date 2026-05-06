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
public class QuestScheduledListener {

  private final NotificationService notificationService;

  @RabbitListener(queues = QueueConstants.QUEST_SCHEDULED_QUEUE)
  @Transactional
  public void onQuestScheduled(QuestScheduledEvent event) {
    log.debug(
        "Received quest.scheduled: userId={} title={} date={}",
        event.userId(),
        event.questTitle(),
        event.scheduledDate());
    notificationService.createScheduledReminder(event);
  }
}
