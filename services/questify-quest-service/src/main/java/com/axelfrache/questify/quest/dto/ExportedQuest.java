package com.axelfrache.questify.quest.dto;

import com.axelfrache.questify.quest.model.Difficulty;
import com.axelfrache.questify.quest.model.RecurrenceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ExportedQuest(
    @NotBlank @Size(min = 1, max = 200) String title,
    @Size(max = 2000) String description,
    Difficulty difficulty,
    @Positive Integer baseXpReward,
    @Size(max = 50) String categoryName,
    RecurrenceType recurrenceInterval,
    List<Integer> recurrenceDays,
    @Valid List<ExportedSubquest> subquests) {}
