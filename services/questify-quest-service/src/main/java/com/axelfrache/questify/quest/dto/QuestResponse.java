package com.axelfrache.questify.quest.dto;

import com.axelfrache.questify.quest.model.Difficulty;
import com.axelfrache.questify.quest.model.QuestStatus;
import com.axelfrache.questify.quest.model.RecurrenceType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuestResponse(
    UUID id,
    UUID templateId,
    String title,
    String description,
    Difficulty difficulty,
    int baseXpReward,
    int totalXpReward,
    QuestStatus status,
    CategoryResponse category,
    UUID projectId,
    Instant dueDate,
    Instant completedAt,
    Instant createdAt,
    Instant updatedAt,
    RecurrenceType recurrenceInterval,
    List<Integer> recurrenceDays,
    UUID parentId,
    String parentTitle,
    int subquestCount,
    int completedSubquestCount,
    UUID assigneeId) {}
