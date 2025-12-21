package com.axelfrache.questify.dto;

import java.time.LocalDate;

public record DailyStats(LocalDate date, int questsCompleted, long xpEarned) {}
