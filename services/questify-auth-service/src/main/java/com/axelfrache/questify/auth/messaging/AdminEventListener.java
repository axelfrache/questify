package com.axelfrache.questify.auth.messaging;

import com.axelfrache.questify.auth.model.Role;
import com.axelfrache.questify.auth.service.UserService;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.propagation.TextMapGetter;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminEventListener {

  private final UserService userService;

  private static final TextMapGetter<MessageProperties> AMQP_GETTER =
      new TextMapGetter<>() {
        @Override
        public Iterable<String> keys(MessageProperties props) {
          return props.getHeaders().keySet().stream().map(Object::toString).toList();
        }

        @Override
        public String get(MessageProperties props, String key) {
          var v = props.getHeader(key);
          return v == null ? null : v.toString();
        }
      };

  private static Context extractContext(MessageProperties props) {
    return GlobalOpenTelemetry.getPropagators()
        .getTextMapPropagator()
        .extract(Context.current(), props, AMQP_GETTER);
  }

  @RabbitListener(queues = QueueConstants.ADMIN_USER_DELETED_QUEUE)
  @Transactional
  public void onAdminUserDeleted(AdminUserDeletedEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processAdminUserDeleted(event);
    }
  }

  @WithSpan("messaging.admin_user_deleted")
  private void processAdminUserDeleted(AdminUserDeletedEvent event) {
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
  public void onAdminUserRoleChanged(AdminUserRoleChangedEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processAdminUserRoleChanged(event);
    }
  }

  @WithSpan("messaging.admin_user_role_changed")
  private void processAdminUserRoleChanged(AdminUserRoleChangedEvent event) {
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
  public void onAdminUserStatusChanged(AdminUserStatusChangedEvent event, Message message) {
    try (var ignored = extractContext(message.getMessageProperties()).makeCurrent()) {
      processAdminUserStatusChanged(event);
    }
  }

  @WithSpan("messaging.admin_user_status_changed")
  private void processAdminUserStatusChanged(AdminUserStatusChangedEvent event) {
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
