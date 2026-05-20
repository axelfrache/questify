package com.axelfrache.questify.notification.service;

import com.axelfrache.questify.notification.dto.NotificationResponse;
import com.axelfrache.questify.notification.dto.PushSubscriptionRequest;
import com.axelfrache.questify.notification.messaging.QuestScheduledEvent;
import com.axelfrache.questify.notification.model.Notification;
import com.axelfrache.questify.notification.model.NotificationType;
import com.axelfrache.questify.notification.model.PushSubscription;
import com.axelfrache.questify.notification.model.ScheduledReminder;
import com.axelfrache.questify.notification.repository.NotificationRepository;
import com.axelfrache.questify.notification.repository.PushSubscriptionRepository;
import com.axelfrache.questify.notification.repository.ScheduledReminderRepository;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final ScheduledReminderRepository scheduledReminderRepository;
  private final PushSubscriptionRepository pushSubscriptionRepository;
  private final PushNotificationService pushNotificationService;
  private final SseEmitterRegistry sseEmitterRegistry;

  @Value("${questify.notification.max-per-user:100}")
  private int maxPerUser;

  @WithSpan("notification.get_all")
  @Transactional(readOnly = true)
  public List<NotificationResponse> getNotifications(UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(this::toResponse)
        .toList();
  }

  @WithSpan("notification.get_unread_count")
  @Transactional(readOnly = true)
  public long getUnreadCount(UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    return notificationRepository.countByUserIdAndReadFalse(userId);
  }

  @WithSpan("notification.mark_read")
  @Transactional
  public void markRead(UUID notificationId, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.notification.id", notificationId);
    notificationRepository
        .findById(notificationId)
        .filter(n -> n.getUserId().equals(userId))
        .ifPresent(
            n -> {
              n.setRead(true);
              notificationRepository.save(n);
            });
  }

  @WithSpan("notification.mark_all_read")
  @Transactional
  public void markAllRead(UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    notificationRepository.markAllReadByUserId(userId);
  }

  @WithSpan("notification.delete")
  @Transactional
  public void delete(UUID notificationId, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.notification.id", notificationId);
    notificationRepository
        .findById(notificationId)
        .filter(n -> n.getUserId().equals(userId))
        .ifPresent(notificationRepository::delete);
  }

  @WithSpan("notification.create_scheduled_reminder")
  @Transactional
  public void createScheduledReminder(QuestScheduledEvent event) {
    setUuidAttribute("questify.user.id", event.userId());
    setUuidAttribute("questify.quest.id", event.templateId());
    setUuidAttribute("questify.quest.occurrence.id", event.occurrenceId());
    if (event.occurrenceId() == null) return;

    var existing =
        scheduledReminderRepository.findByUserIdAndOccurrenceId(
            event.userId(), event.occurrenceId());

    var scheduledDate = LocalDate.parse(event.scheduledDate());

    if (existing.isPresent()) {
      var reminder = existing.get();
      boolean dateChanged = !scheduledDate.equals(reminder.getScheduledDate());
      reminder.setQuestTitle(event.questTitle());
      reminder.setScheduledDate(scheduledDate);
      if (dateChanged) {
        reminder.setReminderSent(false);
      }
      var saved = scheduledReminderRepository.save(reminder);
      if (!saved.isReminderSent()) {
        fireImmediatelyIfDue(saved, scheduledDate);
      }
    } else {
      var saved =
          scheduledReminderRepository.save(
              ScheduledReminder.builder()
                  .userId(event.userId())
                  .templateId(event.templateId())
                  .occurrenceId(event.occurrenceId())
                  .questTitle(event.questTitle())
                  .scheduledDate(scheduledDate)
                  .build());
      fireImmediatelyIfDue(saved, scheduledDate);
    }
  }

  private void fireImmediatelyIfDue(ScheduledReminder reminder, LocalDate scheduledDate) {
    var today = LocalDate.now();
    if (scheduledDate.isAfter(today)) return;

    var isOverdue = scheduledDate.isBefore(today);
    var type = isOverdue ? NotificationType.QUEST_OVERDUE : NotificationType.QUEST_DUE_SOON;
    var title = isOverdue ? "Quest overdue ⚠️" : "Quest due soon ⏰";
    var body =
        isOverdue
            ? "\"" + reminder.getQuestTitle() + "\" is overdue"
            : "\"" + reminder.getQuestTitle() + "\" is due today";

    createAndSendNotification(reminder.getUserId(), type, title, body, reminder.getTemplateId());
    reminder.setReminderSent(true);
    scheduledReminderRepository.save(reminder);
  }

  @WithSpan("notification.mark_reminder_completed")
  @Transactional
  public void markReminderCompleted(UUID userId, UUID occurrenceId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.occurrence.id", occurrenceId);
    scheduledReminderRepository
        .findByUserIdAndOccurrenceId(userId, occurrenceId)
        .ifPresent(
            r -> {
              r.setCompleted(true);
              scheduledReminderRepository.save(r);
            });
  }

  @WithSpan("notification.create_and_send")
  @Transactional
  public void createAndSendNotification(
      UUID userId, NotificationType type, String title, String body, UUID questId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.id", questId);
    if (type != null) Span.current().setAttribute("questify.notification.type", type.name());
    var notification =
        notificationRepository.save(
            Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .questId(questId)
                .build());

    notificationRepository.pruneOldestForUser(userId, maxPerUser);

    var subscriptions = pushSubscriptionRepository.findByUserId(userId);
    Span.current()
        .setAttribute("questify.notification.push_subscription_count", subscriptions.size());
    for (var sub : subscriptions) {
      pushNotificationService.send(sub, title, body);
    }

    var response = toResponse(notification);
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            sseEmitterRegistry.sendToUser(userId, response);
          }
        });

    log.debug("Notification created: type={} userId={} questId={}", type, userId, questId);
  }

  @WithSpan("notification.subscribe_push")
  @Transactional
  public void subscribe(UUID userId, PushSubscriptionRequest request) {
    setUuidAttribute("questify.user.id", userId);
    pushSubscriptionRepository
        .findByUserIdAndEndpoint(userId, request.endpoint())
        .orElseGet(
            () ->
                pushSubscriptionRepository.save(
                    PushSubscription.builder()
                        .userId(userId)
                        .endpoint(request.endpoint())
                        .p256dh(request.p256dh())
                        .authKey(request.auth())
                        .build()));
  }

  @WithSpan("notification.unsubscribe_push")
  @Transactional
  public void unsubscribe(UUID userId, String endpoint) {
    setUuidAttribute("questify.user.id", userId);
    pushSubscriptionRepository.deleteByUserIdAndEndpoint(userId, endpoint);
  }

  @WithSpan("notification.cleanup_reminders")
  @Transactional
  public void cleanupRemindersForDeletedQuest(UUID templateId, UUID occurrenceId) {
    setUuidAttribute("questify.quest.id", templateId);
    setUuidAttribute("questify.quest.occurrence.id", occurrenceId);
    if (occurrenceId != null) {
      scheduledReminderRepository.deleteByOccurrenceId(occurrenceId);
    } else {
      scheduledReminderRepository.deleteByTemplateId(templateId);
    }
  }

  @WithSpan("notification.delete_user_data")
  @Transactional
  public void deleteUserData(UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    notificationRepository.deleteByUserId(userId);
    scheduledReminderRepository.deleteByUserId(userId);
    pushSubscriptionRepository.deleteByUserId(userId);
    log.info("Deleted all notification data for userId={}", userId);
  }

  private NotificationResponse toResponse(Notification n) {
    return new NotificationResponse(
        n.getId(),
        n.getType(),
        n.getTitle(),
        n.getBody(),
        n.getQuestId(),
        n.isRead(),
        n.getCreatedAt());
  }

  private static void setUuidAttribute(String key, UUID value) {
    if (value != null) Span.current().setAttribute(key, value.toString());
  }
}
