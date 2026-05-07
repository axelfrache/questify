package com.axelfrache.questify.quest.messaging;

import java.util.UUID;

public record QuestDeletedEvent(UUID userId, UUID templateId, UUID occurrenceId) {}
