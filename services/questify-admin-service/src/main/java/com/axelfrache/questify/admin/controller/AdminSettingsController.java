package com.axelfrache.questify.admin.controller;

import com.axelfrache.questify.admin.dto.InstanceSettingsResponse;
import com.axelfrache.questify.admin.dto.UpdateSettingsRequest;
import com.axelfrache.questify.admin.service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class AdminSettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public InstanceSettingsResponse getSettings() {
        return settingsService.getSettings();
    }

    @PatchMapping
    public InstanceSettingsResponse updateSettings(@Valid @RequestBody UpdateSettingsRequest request) {
        return settingsService.updateSettings(request);
    }
}
