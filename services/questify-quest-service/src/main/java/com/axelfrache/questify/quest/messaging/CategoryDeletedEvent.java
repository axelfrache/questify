package com.axelfrache.questify.quest.messaging;

import java.util.UUID;

public record CategoryDeletedEvent(UUID userId, String categoryName) {}
