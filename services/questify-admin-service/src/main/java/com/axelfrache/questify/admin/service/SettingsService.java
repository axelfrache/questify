package com.axelfrache.questify.admin.service;

import com.axelfrache.questify.admin.dto.InstanceSettingsResponse;
import com.axelfrache.questify.admin.dto.UpdateSettingsRequest;
import com.axelfrache.questify.admin.model.InstanceSettings;
import com.axelfrache.questify.admin.repository.InstanceSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsService {

  private final InstanceSettingsRepository instanceSettingsRepository;

  @Transactional(readOnly = true)
  public InstanceSettingsResponse getSettings() {
    var settings = getOrCreate();
    return toResponse(settings);
  }

  @Transactional
  public InstanceSettingsResponse updateSettings(UpdateSettingsRequest request) {
    var settings = getOrCreate();
    if (request.registrationEnabled() != null) {
      settings.setRegistrationEnabled(request.registrationEnabled());
    }
    if (request.maintenanceMode() != null) {
      settings.setMaintenanceMode(request.maintenanceMode());
    }
    var saved = instanceSettingsRepository.save(settings);
    log.info(
        "Instance settings updated: registrationEnabled={} maintenanceMode={}",
        saved.isRegistrationEnabled(),
        saved.isMaintenanceMode());
    return toResponse(saved);
  }

  private InstanceSettings getOrCreate() {
    return instanceSettingsRepository
        .findFirst()
        .orElseGet(() -> instanceSettingsRepository.save(InstanceSettings.builder().build()));
  }

  private InstanceSettingsResponse toResponse(InstanceSettings s) {
    return new InstanceSettingsResponse(
        s.isRegistrationEnabled(), s.isMaintenanceMode(), s.getUpdatedAt());
  }
}
