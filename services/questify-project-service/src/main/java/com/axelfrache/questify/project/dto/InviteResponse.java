package com.axelfrache.questify.project.dto;

import java.time.Instant;

public record InviteResponse(String token, Instant expiresAt) {}
