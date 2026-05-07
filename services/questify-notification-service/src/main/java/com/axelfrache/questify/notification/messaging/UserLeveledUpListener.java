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
public class UserLeveledUpListener {

  private final NotificationService notificationService;

  @RabbitListener(queues = QueueConstants.USER_LEVELED_UP_QUEUE)
  @Transactional
  public void onUserLeveledUp(UserLeveledUpEvent event) {
    log.debug(
        "Received user.leveled-up: userId={} level={}->{} grade={}",
        event.userId(),
        event.previousLevel(),
        event.newLevel(),
        event.newGradeLabel());

    var body =
        event.gradeChanged()
            ? "Level " + event.newLevel() + " — you reached \"" + event.newGradeLabel() + "\"!"
            : "You reached level " + event.newLevel() + "!";

    notificationService.createAndSendNotification(
        event.userId(), NotificationType.LEVEL_UP, "Level up! 🌟", body, null);
  }
}
