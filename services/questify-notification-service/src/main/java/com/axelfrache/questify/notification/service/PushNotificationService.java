package com.axelfrache.questify.notification.service;

import com.axelfrache.questify.notification.model.PushSubscription;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

  @Value("${vapid.public-key:}")
  private String vapidPublicKey;

  @Value("${vapid.private-key:}")
  private String vapidPrivateKey;

  @Value("${vapid.subject:mailto:admin@questify.local}")
  private String vapidSubject;

  private final ObjectMapper objectMapper;

  private PushService pushService;
  private boolean pushEnabled = false;

  @PostConstruct
  void init() {
    if (vapidPublicKey.isBlank() || vapidPrivateKey.isBlank()) {
      log.info("VAPID keys not configured — push notifications disabled");
      return;
    }
    try {
      if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
        Security.addProvider(new BouncyCastleProvider());
      }
      pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
      pushEnabled = true;
      log.info("Push notification service initialized");
    } catch (Exception e) {
      log.warn("Failed to initialize push service: {}", e.getMessage());
    }
  }

  public boolean isPushEnabled() {
    return pushEnabled;
  }

  public void send(PushSubscription subscription, String title, String body) {
    if (!pushEnabled) return;
    try {
      var payload =
          objectMapper.writeValueAsString(
              Map.of("title", title, "body", body, "icon", "/logo.png"));
      var notification =
          new Notification(
              subscription.getEndpoint(),
              subscription.getP256dh(),
              subscription.getAuthKey(),
              payload.getBytes());
      pushService.send(notification);
    } catch (Exception e) {
      log.warn(
          "Push failed for user={} endpoint={}: {}",
          subscription.getUserId(),
          subscription.getEndpoint(),
          e.getMessage());
    }
  }
}
