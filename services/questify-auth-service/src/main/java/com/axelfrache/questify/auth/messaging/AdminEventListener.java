package com.axelfrache.questify.auth.messaging;

import com.axelfrache.questify.auth.model.Role;
import com.axelfrache.questify.auth.service.UserService;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.util.UUID;
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
  @WithSpan("messaging.admin_user_deleted")
  public void onAdminUserDeleted(AdminUserDeletedEvent event) {
    setEventAttributes("admin.user.deleted", event.userId());
    log.info("Admin force-deleting user {}", event.userId());
    try {
      userService.forceDeleteUser(event.userId());
    } catch (IllegalArgumentException e) {
      log.warn("User {} not found during admin force-delete, skipping", event.userId());
    }
  }

  @RabbitListener(queues = QueueConstants.ADMIN_USER_ROLE_CHANGED_QUEUE)
  @Transactional
  @WithSpan("messaging.admin_user_role_changed")
  public void onAdminUserRoleChanged(AdminUserRoleChangedEvent event) {
    setEventAttributes("admin.user.role_changed", event.userId());
    if (event.newRole() != null)
      Span.current().setAttribute("questify.user.role.target", event.newRole());
    log.info("Admin changing role of user {} to {}", event.userId(), event.newRole());
    try {
      userService.updateUserRole(event.userId(), Role.valueOf(event.newRole()));
    } catch (IllegalArgumentException e) {
      log.warn("Could not apply role change for user {}: {}", event.userId(), e.getMessage());
    }
  }

  @RabbitListener(queues = QueueConstants.ADMIN_USER_STATUS_CHANGED_QUEUE)
  @Transactional
  @WithSpan("messaging.admin_user_status_changed")
  public void onAdminUserStatusChanged(AdminUserStatusChangedEvent event) {
    setEventAttributes("admin.user.status_changed", event.userId());
    Span.current().setAttribute("questify.user.enabled.target", event.enabled());
    log.info("Admin changing status of user {} to enabled={}", event.userId(), event.enabled());
    try {
      userService.updateUserStatus(event.userId(), event.enabled());
    } catch (IllegalArgumentException e) {
      log.warn("Could not apply status change for user {}: {}", event.userId(), e.getMessage());
    }
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    if (userId != null) Span.current().setAttribute("questify.user.id", userId.toString());
  }
}
