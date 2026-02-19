package com.axelfrache.questify.dto;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UUID userId,
        String username,
        String profilePictureUrl,
        com.axelfrache.questify.model.Role role) {
}
