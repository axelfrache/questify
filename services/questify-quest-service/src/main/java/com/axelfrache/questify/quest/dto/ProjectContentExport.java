package com.axelfrache.questify.quest.dto;

import java.util.List;

public record ProjectContentExport(List<ExportedCategory> categories, List<ExportedQuest> quests) {}
