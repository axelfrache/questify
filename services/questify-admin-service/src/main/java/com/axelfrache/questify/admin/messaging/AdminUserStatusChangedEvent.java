package com.axelfrache.questify.admin.messaging;

import java.util.UUID;

public record AdminUserStatusChangedEvent(UUID userId, boolean enabled) {}
