package com.axelfrache.questify.stats.messaging;

import java.util.UUID;

public record CategoryDeletedEvent(UUID userId, String categoryName) {}
