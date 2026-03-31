package com.axelfrache.questify.auth.dto;

import com.axelfrache.questify.auth.model.Role;
import java.util.UUID;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    UUID userId,
    String username,
    String profilePictureUrl,
    Role role) {}
