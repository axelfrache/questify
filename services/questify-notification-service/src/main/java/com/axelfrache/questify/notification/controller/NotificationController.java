package com.axelfrache.questify.notification.controller;

import com.axelfrache.questify.notification.dto.NotificationResponse;
import com.axelfrache.questify.notification.dto.PushSubscriptionRequest;
import com.axelfrache.questify.notification.dto.UnreadCountResponse;
import com.axelfrache.questify.notification.service.NotificationService;
import com.axelfrache.questify.notification.service.PushNotificationService;
import com.axelfrache.questify.notification.service.SseEmitterRegistry;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

  private final NotificationService notificationService;
  private final PushNotificationService pushNotificationService;
  private final SseEmitterRegistry sseEmitterRegistry;

  @GetMapping
  public List<NotificationResponse> getNotifications(@AuthenticationPrincipal String userId) {
    return notificationService.getNotifications(UUID.fromString(userId));
  }

  @GetMapping("/unread-count")
  public UnreadCountResponse getUnreadCount(@AuthenticationPrincipal String userId) {
    return new UnreadCountResponse(notificationService.getUnreadCount(UUID.fromString(userId)));
  }

  @PatchMapping("/{id}/read")
  public ResponseEntity<Void> markRead(
      @PathVariable UUID id, @AuthenticationPrincipal String userId) {
    notificationService.markRead(id, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/read-all")
  public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal String userId) {
    notificationService.markAllRead(UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @PathVariable UUID id, @AuthenticationPrincipal String userId) {
    notificationService.delete(id, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping
  public ResponseEntity<Void> deleteAll(@AuthenticationPrincipal String userId) {
    notificationService.deleteAll(UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream(@AuthenticationPrincipal String userId) {
    return sseEmitterRegistry.subscribe(UUID.fromString(userId));
  }

  @GetMapping("/push/status")
  public Map<String, Boolean> getPushStatus() {
    return Map.of("enabled", pushNotificationService.isPushEnabled());
  }

  @PostMapping("/push/subscribe")
  public ResponseEntity<Void> subscribe(
      @AuthenticationPrincipal String userId, @RequestBody @Valid PushSubscriptionRequest request) {
    notificationService.subscribe(UUID.fromString(userId), request);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/push/subscribe")
  public ResponseEntity<Void> unsubscribe(
      @AuthenticationPrincipal String userId, @RequestParam String endpoint) {
    notificationService.unsubscribe(UUID.fromString(userId), endpoint);
    return ResponseEntity.noContent().build();
  }
}
