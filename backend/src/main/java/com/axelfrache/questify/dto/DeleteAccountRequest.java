package com.axelfrache.questify.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(@NotBlank(message = "Password is required") String password) {}
