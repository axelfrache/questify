package com.axelfrache.questify.project.dto;

import java.time.Instant;
import java.util.UUID;

public record ProjectDetailResponse(
    UUID id,
    String name,
    String description,
    String icon,
    boolean pinned,
    Instant archivedAt,
    Instant createdAt,
    Instant updatedAt) {}
