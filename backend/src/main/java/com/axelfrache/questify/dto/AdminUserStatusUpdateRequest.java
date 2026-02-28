package com.axelfrache.questify.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record AdminUserStatusUpdateRequest(@JsonProperty("isEnabled") @NotNull Boolean isEnabled) {}
