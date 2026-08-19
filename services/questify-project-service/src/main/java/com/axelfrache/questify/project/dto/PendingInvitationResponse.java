package com.axelfrache.questify.project.dto;

import com.axelfrache.questify.project.model.ProjectRole;
import java.time.Instant;
import java.util.UUID;

public record PendingInvitationResponse(
    UUID id, String email, ProjectRole role, Instant expiresAt, Instant createdAt) {}
