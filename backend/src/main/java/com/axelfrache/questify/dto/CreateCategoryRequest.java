package com.axelfrache.questify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
    @NotBlank @Size(min = 1, max = 50) String name,
    @Size(max = 10) String icon,
    @Size(max = 7) String color) {}
