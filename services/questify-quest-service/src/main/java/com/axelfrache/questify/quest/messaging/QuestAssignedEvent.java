package com.axelfrache.questify.quest.messaging;

import java.util.UUID;

public record QuestAssignedEvent(
    UUID assignerId, UUID assigneeId, UUID questId, String questTitle, UUID projectId) {}
