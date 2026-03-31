package com.axelfrache.questify.admin.messaging;

import java.time.Instant;
import java.util.UUID;

public record UserRegisteredEvent(
    UUID userId, String username, String email, String role, Instant createdAt) {}
