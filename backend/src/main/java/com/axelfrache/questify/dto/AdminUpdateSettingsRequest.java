package com.axelfrache.questify.dto;

import jakarta.validation.constraints.NotNull;

public record AdminUpdateSettingsRequest(@NotNull Boolean registrationEnabled) {}
