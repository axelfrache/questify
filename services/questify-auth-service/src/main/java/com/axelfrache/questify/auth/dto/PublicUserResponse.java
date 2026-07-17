package com.axelfrache.questify.auth.dto;

import java.util.UUID;

public record PublicUserResponse(UUID id, String username, String profilePictureUrl) {}
