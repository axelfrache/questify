package com.axelfrache.questify.progression.dto;

import com.axelfrache.questify.progression.model.Grade;
import java.util.UUID;

public record ProgressionResponse(
    UUID userId,
    long totalXp,
    int level,
    Grade grade,
    String gradeLabel,
    long currentLevelXp,
    long nextLevelXp,
    double progressPercent) {}
