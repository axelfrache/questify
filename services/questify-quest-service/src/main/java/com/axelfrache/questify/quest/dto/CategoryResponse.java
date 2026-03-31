package com.axelfrache.questify.quest.dto;

import java.util.UUID;

public record CategoryResponse(UUID id, String name, String icon, String color, boolean isGlobal) {}
