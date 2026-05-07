package com.axelfrache.questify.notification.messaging;

import java.util.UUID;

public record QuestDeletedEvent(UUID userId, UUID templateId, UUID occurrenceId) {}
