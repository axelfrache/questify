package com.axelfrache.questify.stats.dto;

import java.time.LocalDate;

public record DailyStatsResponse(LocalDate date, int questsCompleted, int xpEarned) {}
