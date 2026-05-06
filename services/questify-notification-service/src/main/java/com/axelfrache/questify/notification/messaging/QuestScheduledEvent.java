package com.axelfrache.questify.notification.messaging;

import java.util.UUID;

public record QuestScheduledEvent(
    UUID userId, UUID templateId, UUID occurrenceId, String questTitle, String scheduledDate) {}
