package com.axelfrache.questify.dto;

import java.util.List;

public record ProjectSidebarResponse(
    List<ProjectSummaryResponse> pinned, List<ProjectSummaryResponse> recent) {}
