package com.axelfrache.questify.stats.dto;

import java.time.Instant;
import java.util.UUID;

public record QuestHistoryResponse(
    UUID questId, String questTitle, int xpEarned, String categoryName, Instant completedAt) {}
