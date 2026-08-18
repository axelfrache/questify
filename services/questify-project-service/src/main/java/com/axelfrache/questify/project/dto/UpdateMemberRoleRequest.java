package com.axelfrache.questify.project.dto;

import com.axelfrache.questify.project.model.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(@NotNull ProjectRole role) {}
