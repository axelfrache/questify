package com.axelfrache.questify.auth.messaging;

import com.axelfrache.questify.auth.model.Role;
import com.axelfrache.questify.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminEventListener {

  private final UserService userService;

  @RabbitListener(queues = QueueConstants.ADMIN_USER_DELETED_QUEUE)
  @Transactional
  public void onAdminUserDeleted(AdminUserDeletedEvent event) {
    log.info("Admin force-deleting user {}", event.userId());
    userService.forceDeleteUser(event.userId());
  }

  @RabbitListener(queues = QueueConstants.ADMIN_USER_ROLE_CHANGED_QUEUE)
  @Transactional
  public void onAdminUserRoleChanged(AdminUserRoleChangedEvent event) {
    log.info("Admin changing role of user {} to {}", event.userId(), event.newRole());
    userService.updateUserRole(event.userId(), Role.valueOf(event.newRole()));
  }

  @RabbitListener(queues = QueueConstants.ADMIN_USER_STATUS_CHANGED_QUEUE)
  @Transactional
  public void onAdminUserStatusChanged(AdminUserStatusChangedEvent event) {
    log.info("Admin changing status of user {} to enabled={}", event.userId(), event.enabled());
    userService.updateUserStatus(event.userId(), event.enabled());
  }
}
