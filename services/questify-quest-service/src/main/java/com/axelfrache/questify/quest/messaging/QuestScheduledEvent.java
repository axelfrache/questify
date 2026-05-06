package com.axelfrache.questify.quest.messaging;

import java.util.UUID;

public record QuestScheduledEvent(
    UUID userId, UUID templateId, UUID occurrenceId, String questTitle, String scheduledDate) {}
