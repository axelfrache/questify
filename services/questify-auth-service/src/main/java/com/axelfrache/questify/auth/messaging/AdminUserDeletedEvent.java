package com.axelfrache.questify.auth.messaging;

import java.util.UUID;

public record AdminUserDeletedEvent(UUID userId) {}
