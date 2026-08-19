package com.axelfrache.questify.project.dto;

import com.axelfrache.questify.project.model.ProjectRole;

public record InviteLinkResponse(boolean enabled, ProjectRole role, String url) {}
