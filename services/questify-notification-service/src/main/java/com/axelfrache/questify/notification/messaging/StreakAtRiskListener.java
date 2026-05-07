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
public class StreakAtRiskListener {

  private final NotificationService notificationService;

  @RabbitListener(queues = QueueConstants.STREAK_AT_RISK_QUEUE)
  @Transactional
  public void onStreakAtRisk(StreakAtRiskEvent event) {
    log.debug("Received user.streak-at-risk: userId={}", event.userId());

    notificationService.createAndSendNotification(
        event.userId(),
        NotificationType.STREAK_AT_RISK,
        "Your streak is at risk! 🔥",
        "Complete a quest today before midnight to keep your streak alive.",
        null);
  }
}
