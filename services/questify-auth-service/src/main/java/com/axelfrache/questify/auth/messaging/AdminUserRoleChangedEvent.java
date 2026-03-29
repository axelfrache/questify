package com.axelfrache.questify.auth.messaging;

import java.util.UUID;

public record AdminUserRoleChangedEvent(UUID userId, String newRole) {}
