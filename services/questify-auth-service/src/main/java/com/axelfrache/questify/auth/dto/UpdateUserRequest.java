package com.axelfrache.questify.auth.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @Size(min = 3, max = 50) String username, String timezone, @Size(max = 280) String bio) {}
