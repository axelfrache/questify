package com.axelfrache.questify.dto;

public record AuthResponse(String accessToken, String refreshToken, String username) {}
