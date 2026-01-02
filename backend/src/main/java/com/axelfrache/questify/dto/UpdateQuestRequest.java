package com.axelfrache.questify.dto;

import com.axelfrache.questify.model.Difficulty;
import com.axelfrache.questify.model.RecurrenceType;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record UpdateQuestRequest(
    @Size(min = 1, max = 200) String title,
    @Size(max = 2000) String description,
    Difficulty difficulty,
    Integer baseXpReward,
    Instant dueDate,
    RecurrenceType recurrenceInterval,
    List<Integer> recurrenceDays) {}
