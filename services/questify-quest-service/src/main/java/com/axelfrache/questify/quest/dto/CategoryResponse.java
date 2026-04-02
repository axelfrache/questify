package com.axelfrache.questify.quest.dto;

import com.axelfrache.questify.quest.model.CategorySource;
import java.util.UUID;

public record CategoryResponse(
    UUID id, String name, String icon, String color, CategorySource source, boolean isGlobal) {}
