package com.axelfrache.questify.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public record UserDto(
    UUID id,
    String username,
    String email,
    String timezone,
    String profilePictureUrl,
    Instant createdAt,
    Instant updatedAt,
    com.axelfrache.questify.model.Role role,
    @JsonProperty("isEnabled") boolean isEnabled) {}
