package com.axelfrache.questify.dto;

import com.axelfrache.questify.model.Grade;

public record ProgressionResult(
    long previousXp,
    long currentXp,
    int previousLevel,
    int currentLevel,
    Grade previousGrade,
    Grade currentGrade,
    boolean leveledUp,
    boolean gradeChanged) {}
