package com.axelfrache.questify.auth.messaging;

import java.time.Instant;
import java.util.UUID;

public record UserRegisteredEvent(
    UUID userId, String username, String email, String role, Instant createdAt) {}
