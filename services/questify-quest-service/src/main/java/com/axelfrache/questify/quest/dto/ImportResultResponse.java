package com.axelfrache.questify.quest.dto;

public record ImportResultResponse(
    int questsCreated, int subquestsCreated, int categoriesCreated) {}
