package com.axelfrache.questify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank String currentPassword,
    @NotBlank @Size(min = 12, message = "Password must be at least 12 characters") @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
            message = "Password must contain uppercase, lowercase, and digit")
        String newPassword) {}
