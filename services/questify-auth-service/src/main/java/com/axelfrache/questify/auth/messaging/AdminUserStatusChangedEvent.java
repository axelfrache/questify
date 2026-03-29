package com.axelfrache.questify.auth.messaging;

import java.util.UUID;

public record AdminUserStatusChangedEvent(UUID userId, boolean enabled) {}
