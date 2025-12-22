package com.axelfrache.questify.dto;

import java.time.Instant;
import java.util.UUID;

public record UserDto(
    UUID id,
    String username,
    String email,
    String timezone,
    String profilePictureUrl,
    Instant createdAt,
    Instant updatedAt) {}
