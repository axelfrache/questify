package com.axelfrache.questify.stats.dto;

public record CategoryStatsResponse(String categoryName, long questsCompleted, long xpEarned) {}
