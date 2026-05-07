package com.axelfrache.questify.notification.messaging;

import java.util.UUID;

public record UserLeveledUpEvent(
    UUID userId, int previousLevel, int newLevel, String newGradeLabel, boolean gradeChanged) {}
