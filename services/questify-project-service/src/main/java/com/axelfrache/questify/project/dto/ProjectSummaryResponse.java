package com.axelfrache.questify.project.dto;

import java.time.Instant;
import java.util.UUID;

public record ProjectSummaryResponse(
    UUID id,
    String name,
    String description,
    String icon,
    boolean pinned,
    boolean archived,
    Instant updatedAt) {}
