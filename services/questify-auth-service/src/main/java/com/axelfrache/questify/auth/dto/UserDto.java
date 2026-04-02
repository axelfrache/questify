package com.axelfrache.questify.auth.dto;

import com.axelfrache.questify.auth.model.Role;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public record UserDto(
    UUID id,
    String username,
    String email,
    String timezone,
    String bio,
    String profilePictureUrl,
    Instant createdAt,
    Instant updatedAt,
    Role role,
    @JsonProperty("isEnabled") boolean isEnabled) {}
