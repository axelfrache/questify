package com.axelfrache.questify.admin.dto;

import java.time.Instant;

public record InstanceSettingsResponse(
    boolean registrationEnabled, boolean maintenanceMode, Instant updatedAt) {}
