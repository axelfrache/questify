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

  @Transactional(readOnly = true)
  public List<NotificationResponse> getNotifications(UUID userId) {
    return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public long getUnreadCount(UUID userId) {
    return notificationRepository.countByUserIdAndReadFalse(userId);
  }

  @Transactional
  public void markRead(UUID notificationId, UUID userId) {
    notificationRepository
        .findById(notificationId)
        .filter(n -> n.getUserId().equals(userId))
        .ifPresent(
            n -> {
              n.setRead(true);
              notificationRepository.save(n);
            });
  }

  @Transactional
  public void markAllRead(UUID userId) {
    notificationRepository.markAllReadByUserId(userId);
  }

  @Transactional
  public void delete(UUID notificationId, UUID userId) {
    notificationRepository
        .findById(notificationId)
        .filter(n -> n.getUserId().equals(userId))
        .ifPresent(notificationRepository::delete);
  }

  @Transactional
  public void createScheduledReminder(QuestScheduledEvent event) {
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
      scheduledReminderRepository.save(reminder);
    } else {
      scheduledReminderRepository.save(
          ScheduledReminder.builder()
              .userId(event.userId())
              .templateId(event.templateId())
              .occurrenceId(event.occurrenceId())
              .questTitle(event.questTitle())
              .scheduledDate(scheduledDate)
              .build());
    }
  }

  @Transactional
  public void markReminderCompleted(UUID userId, UUID occurrenceId) {
    scheduledReminderRepository
        .findByUserIdAndOccurrenceId(userId, occurrenceId)
        .ifPresent(
            r -> {
              r.setCompleted(true);
              scheduledReminderRepository.save(r);
            });
  }

  @Transactional
  public void createAndSendNotification(
      UUID userId, NotificationType type, String title, String body, UUID questId) {
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

  @Transactional
  public void subscribe(UUID userId, PushSubscriptionRequest request) {
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

  @Transactional
  public void unsubscribe(UUID userId, String endpoint) {
    pushSubscriptionRepository.deleteByUserIdAndEndpoint(userId, endpoint);
  }

  @Transactional
  public void cleanupRemindersForDeletedQuest(UUID templateId, UUID occurrenceId) {
    if (occurrenceId != null) {
      scheduledReminderRepository.deleteByOccurrenceId(occurrenceId);
    } else {
      scheduledReminderRepository.deleteByTemplateId(templateId);
    }
  }

  @Transactional
  public void deleteUserData(UUID userId) {
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
}
