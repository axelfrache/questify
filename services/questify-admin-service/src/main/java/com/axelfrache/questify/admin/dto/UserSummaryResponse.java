package com.axelfrache.questify.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record UserSummaryResponse(
    UUID id, String username, String email, String role, boolean enabled, Instant createdAt) {}
