package com.axelfrache.questify.dto;

import java.util.UUID;

public record CategoryResponse(UUID id, String name, String icon, String color, boolean isGlobal) {}
