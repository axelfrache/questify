package com.axelfrache.questify.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateRoleRequest(
    @NotBlank @Pattern(regexp = "USER|ADMIN", message = "role must be USER or ADMIN") String role) {}
