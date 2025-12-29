package com.axelfrache.questify.dto;

import java.util.UUID;

public record RegionActivityStats(
    UUID categoryId, String name, String icon, String color, int completedThisMonth) {}
