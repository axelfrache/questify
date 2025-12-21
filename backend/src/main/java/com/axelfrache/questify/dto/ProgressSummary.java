package com.axelfrache.questify.dto;

public record ProgressSummary(
    DailyStats today,
    WeeklyStats thisWeek,
    MonthlyStats thisMonth,
    int totalQuestsCompleted,
    String favoriteCategory,
    UserProgressionDto levelProgress) {}
