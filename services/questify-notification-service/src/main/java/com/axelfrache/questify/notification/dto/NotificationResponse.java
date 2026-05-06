package com.axelfrache.questify.notification.dto;

import com.axelfrache.questify.notification.model.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    NotificationType type,
    String title,
    String body,
    UUID questId,
    boolean read,
    Instant createdAt) {}
