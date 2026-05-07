package com.axelfrache.questify.auth.controller;

import com.axelfrache.questify.auth.dto.RegisterRequest;
import com.axelfrache.questify.auth.repository.InstanceSettingsRepository;
import com.axelfrache.questify.auth.service.FerrisKeyRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Profile("prod")
@RequiredArgsConstructor
public class ProdRegistrationController {

  private final FerrisKeyRegistrationService ferrisKeyRegistrationService;
  private final InstanceSettingsRepository instanceSettingsRepository;

  @PostMapping("/register")
  public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
    var settings =
        instanceSettingsRepository
            .findFirstByOrderByUpdatedAtDesc()
            .orElseThrow(() -> new IllegalStateException("Instance settings not initialized"));

    if (!settings.isRegistrationEnabled()) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    ferrisKeyRegistrationService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }
}
