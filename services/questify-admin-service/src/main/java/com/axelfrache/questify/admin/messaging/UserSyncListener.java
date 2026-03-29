package com.axelfrache.questify.admin.messaging;

import com.axelfrache.questify.admin.model.UserSnapshot;
import com.axelfrache.questify.admin.repository.UserSnapshotRepository;
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
  public void onUserRegistered(UserRegisteredEvent event) {
    log.debug("Syncing new user snapshot: userId={}", event.userId());
    userSnapshotRepository.save(
        UserSnapshot.builder()
            .id(event.userId())
            .username(event.username())
            .email(event.email())
            .role(event.role())
            .enabled(true)
            .createdAt(event.createdAt())
            .build());
  }

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEUE)
  @Transactional
  public void onUserDeleted(UserDeletedEvent event) {
    log.debug("Removing user snapshot: userId={}", event.userId());
    userSnapshotRepository.findById(event.userId())
        .ifPresent(userSnapshotRepository::delete);
  }
}
