package com.axelfrache.questify.common.event;

import java.time.Instant;
import java.util.UUID;

public record QuestCompletedEvent(
    UUID questId,
    String title,
    String difficulty,
    int baseXpReward,
    UUID categoryId,
    String categoryName,
    Instant completedAt) {}
