package com.axelfrache.questify.dto;

import com.axelfrache.questify.model.Difficulty;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.model.RecurrenceType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuestResponse(
    UUID id,
    String title,
    String description,
    Difficulty difficulty,
    int baseXpReward,
    int totalXpReward,
    QuestStatus status,
    CategoryResponse category,
    Instant dueDate,
    Instant completedAt,
    Instant createdAt,
    Instant updatedAt,
    RecurrenceType recurrenceInterval,
    List<Integer> recurrenceDays) {}
