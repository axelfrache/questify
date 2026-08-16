package com.axelfrache.questify.quest.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record ImportProjectContentRequest(
    @NotNull UUID projectId,
    @Valid List<ExportedCategory> categories,
    @Valid List<ExportedQuest> quests) {}
