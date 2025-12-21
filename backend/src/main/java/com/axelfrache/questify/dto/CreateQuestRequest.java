package com.axelfrache.questify.dto;

import com.axelfrache.questify.model.Difficulty;
import com.axelfrache.questify.model.RecurrenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record CreateQuestRequest(
    @NotBlank @Size(min = 1, max = 200) String title,
    @Size(max = 2000) String description,
    Difficulty difficulty,
    @Positive Integer baseXpReward,
    UUID categoryId,
    Instant dueDate,
    RecurrenceType recurrenceInterval) {}
