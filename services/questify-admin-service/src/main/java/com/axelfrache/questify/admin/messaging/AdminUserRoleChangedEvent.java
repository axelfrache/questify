package com.axelfrache.questify.admin.messaging;

import java.util.UUID;

public record AdminUserRoleChangedEvent(UUID userId, String newRole) {}
