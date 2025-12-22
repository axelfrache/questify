package com.axelfrache.questify.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(@Size(min = 3, max = 50) String username, String timezone) {}
