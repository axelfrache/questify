package com.axelfrache.questify.dto;

import java.time.LocalDate;

public record DailyCompletionRate(
    LocalDate date, int plannedQuests, int completedQuests, double completionRate) {}
