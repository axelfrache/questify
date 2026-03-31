package com.axelfrache.questify.progression.dto;

import com.axelfrache.questify.progression.model.AchievementType;
import java.time.Instant;
import java.util.UUID;

public record AchievementResponse(
    UUID id,
    String code,
    String name,
    String description,
    String icon,
    AchievementType type,
    int threshold,
    String categoryName,
    boolean unlocked,
    Instant unlockedAt) {}
