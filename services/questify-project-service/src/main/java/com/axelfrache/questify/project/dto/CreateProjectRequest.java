package com.axelfrache.questify.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
    @NotBlank @Size(min = 1, max = 120) String name,
    @Size(max = 2000) String description,
    @Size(max = 10) String icon) {}
