package com.axelfrache.questify.project.dto;

import java.util.List;

public record ProjectSidebarResponse(
    List<ProjectSummaryResponse> pinned, List<ProjectSummaryResponse> recent) {}
