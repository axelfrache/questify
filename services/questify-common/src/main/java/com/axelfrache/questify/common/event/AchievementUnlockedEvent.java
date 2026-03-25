package com.axelfrache.questify.common.event;

import java.util.UUID;

public record AchievementUnlockedEvent(UUID achievementId, String code) {}
