package com.axelfrache.questify.project.dto;

import com.axelfrache.questify.project.model.ProjectRole;
import java.time.Instant;
import java.util.UUID;

public record ProjectMemberResponse(UUID userId, ProjectRole role, Instant joinedAt) {}
