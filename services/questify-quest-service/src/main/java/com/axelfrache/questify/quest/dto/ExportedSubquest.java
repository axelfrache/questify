package com.axelfrache.questify.quest.dto;

import com.axelfrache.questify.quest.model.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ExportedSubquest(
    @NotBlank @Size(min = 1, max = 200) String title,
    @Size(max = 2000) String description,
    Difficulty difficulty,
    @Positive Integer baseXpReward,
    @Size(max = 50) String categoryName) {}
