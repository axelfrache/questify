package com.axelfrache.questify.admin.messaging;

import com.axelfrache.questify.admin.model.UserSnapshot;
import com.axelfrache.questify.admin.repository.UserSnapshotRepository;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserSyncListener {

  private final UserSnapshotRepository userSnapshotRepository;

  @RabbitListener(queues = QueueConstants.USER_REGISTERED_QUEUE)
  @Transactional
  @WithSpan("messaging.user_registered_sync")
  public void onUserRegistered(UserRegisteredEvent event) {
    setEventAttributes("user.registered", event.userId());
    if (event.role() != null) Span.current().setAttribute("questify.user.role", event.role());
    log.debug("Syncing new user snapshot: userId={}", event.userId());
    userSnapshotRepository.save(
        UserSnapshot.builder()
            .id(event.userId())
            .username(event.username())
            .email(event.email())
            .role(event.role())
            .enabled(true)
            .createdAt(event.createdAt() != null ? event.createdAt() : Instant.now())
            .build());
  }

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEUE)
  @Transactional
  @WithSpan("messaging.user_deleted_sync")
  public void onUserDeleted(UserDeletedEvent event) {
    setEventAttributes("user.deleted", event.userId());
    log.debug("Removing user snapshot: userId={}", event.userId());
    userSnapshotRepository.findById(event.userId()).ifPresent(userSnapshotRepository::delete);
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    if (userId != null) Span.current().setAttribute("questify.user.id", userId.toString());
  }
}
