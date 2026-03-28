package com.axelfrache.questify.quest.messaging;

import java.util.UUID;

public record QuestCompletedEvent(UUID userId, UUID questId, String questTitle, int xpEarned) {}
