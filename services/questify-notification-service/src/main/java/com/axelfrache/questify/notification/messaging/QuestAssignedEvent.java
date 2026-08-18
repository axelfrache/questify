package com.axelfrache.questify.notification.messaging;

import java.util.UUID;

public record QuestAssignedEvent(
    UUID assignerId, UUID assigneeId, UUID questId, String questTitle, UUID projectId) {}
