package com.axelfrache.questify.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.axelfrache.questify.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminUpdateUserRequest(
        @Size(min = 3, max = 50) String username,
        @Email String email,
        Role role,
        @JsonProperty("isEnabled") Boolean isEnabled,
        @Size(min = 8) @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$", message = "Password must contain uppercase, lowercase, and digit") String password) {
}
