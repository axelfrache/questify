package com.axelfrache.questify.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(@NotBlank String password) {}
