package com.axelfrache.questify.project.dto;

import com.axelfrache.questify.project.model.ProjectRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateInvitationRequest(
    @NotBlank @Email @Size(max = 320) String email, @NotNull ProjectRole role) {}
