package com.axelfrache.questify.notification.scheduler;

import com.axelfrache.questify.notification.model.NotificationType;
import com.axelfrache.questify.notification.repository.ScheduledReminderRepository;
import com.axelfrache.questify.notification.service.NotificationService;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

  private final ScheduledReminderRepository scheduledReminderRepository;
  private final NotificationService notificationService;

  @Value("${questify.reminder.hours-before:24}")
  private int hoursBefore;

  @Scheduled(fixedDelayString = "${questify.reminder.check-delay-ms:900000}")
  public void checkReminders() {
    var cutoff = LocalDate.now().plusDays((hoursBefore + 23) / 24);
    var due = scheduledReminderRepository.findDueReminders(cutoff);

    if (due.isEmpty()) return;

    log.debug("Processing {} due reminders", due.size());

    for (var reminder : due) {
      try {
        var today = LocalDate.now();
        var isOverdue = reminder.getScheduledDate().isBefore(today);

        var type = isOverdue ? NotificationType.QUEST_OVERDUE : NotificationType.QUEST_DUE_SOON;
        var title = isOverdue ? "Quest overdue ⚠️" : "Quest due soon ⏰";
        var body =
            isOverdue
                ? "\"" + reminder.getQuestTitle() + "\" is overdue"
                : "\"" + reminder.getQuestTitle() + "\" is due today";

        notificationService.createAndSendNotification(
            reminder.getUserId(), type, title, body, reminder.getTemplateId());

        reminder.setReminderSent(true);
        scheduledReminderRepository.save(reminder);
      } catch (Exception e) {
        log.warn("Failed to process reminder {}: {}", reminder.getId(), e.getMessage());
      }
    }
  }
}
