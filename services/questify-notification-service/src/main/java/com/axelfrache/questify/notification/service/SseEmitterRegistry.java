package com.axelfrache.questify.notification.service;

import com.axelfrache.questify.notification.dto.NotificationResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
@RequiredArgsConstructor
@Slf4j
public class SseEmitterRegistry {

  private final ObjectMapper objectMapper;
  private final Map<UUID, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

  public SseEmitter subscribe(UUID userId) {
    var emitter = new SseEmitter(Long.MAX_VALUE);
    emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

    emitter.onCompletion(() -> remove(userId, emitter));
    emitter.onTimeout(() -> remove(userId, emitter));
    emitter.onError(e -> remove(userId, emitter));

    log.debug("SSE subscribed: userId={}", userId);
    return emitter;
  }

  public void sendToUser(UUID userId, NotificationResponse notification) {
    var userEmitters = emitters.get(userId);
    if (userEmitters == null || userEmitters.isEmpty()) return;

    String json;
    try {
      json = objectMapper.writeValueAsString(notification);
    } catch (IOException e) {
      log.warn("Failed to serialize notification for SSE: {}", e.getMessage());
      return;
    }

    List<SseEmitter> dead = new CopyOnWriteArrayList<>();
    for (var emitter : userEmitters) {
      try {
        emitter.send(
            SseEmitter.event().name("notification").data(json, MediaType.APPLICATION_JSON));
      } catch (IOException e) {
        dead.add(emitter);
      }
    }
    userEmitters.removeAll(dead);
  }

  private void remove(UUID userId, SseEmitter emitter) {
    var userEmitters = emitters.get(userId);
    if (userEmitters != null) {
      userEmitters.remove(emitter);
      log.debug("SSE unsubscribed: userId={}", userId);
    }
  }
}
