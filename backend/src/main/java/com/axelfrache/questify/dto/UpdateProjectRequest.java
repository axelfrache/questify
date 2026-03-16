package com.axelfrache.questify.dto;

import jakarta.validation.constraints.Size;

public record UpdateProjectRequest(
    @Size(min = 1, max = 120) String name,
    @Size(max = 2000) String description,
    @Size(max = 10) String icon,
    Boolean archived) {}
