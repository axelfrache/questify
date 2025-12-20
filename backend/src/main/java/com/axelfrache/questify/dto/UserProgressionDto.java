package com.axelfrache.questify.dto;

import com.axelfrache.questify.model.Grade;
import java.util.UUID;

public record UserProgressionDto(
    UUID id,
    String username,
    long totalXp,
    int level,
    Grade grade,
    String gradeLabel,
    long currentLevelXp,
    long nextLevelXp,
    double progressPercent) {}
