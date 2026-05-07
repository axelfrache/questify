package com.axelfrache.questify.progression.messaging;

import java.util.UUID;

public record UserLeveledUpEvent(
    UUID userId, int previousLevel, int newLevel, String newGradeLabel, boolean gradeChanged) {}
