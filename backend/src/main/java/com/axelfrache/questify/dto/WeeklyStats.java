package com.axelfrache.questify.dto;

import java.util.List;

public record WeeklyStats(
    int questsCompleted, long xpEarned, double averagePerDay, List<DailyStats> dailyBreakdown) {}
