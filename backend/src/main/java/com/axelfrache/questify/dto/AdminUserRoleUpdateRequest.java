package com.axelfrache.questify.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminUserRoleUpdateRequest(@NotBlank String role) {}
