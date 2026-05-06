package com.axelfrache.questify.notification.messaging;

import java.time.Instant;
import java.util.UUID;

public record QuestCompletedEvent(
    UUID userId,
    UUID questId,
    String questTitle,
    int xpEarned,
    String categoryName,
    Instant completedAt) {}
