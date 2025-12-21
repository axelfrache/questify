package com.axelfrache.questify.dto;

import java.util.UUID;

public record CategoryStats(
    UUID categoryId,
    String name,
    String icon,
    String color,
    int totalQuests,
    int completedQuests,
    double progress,
    String grade) {}
