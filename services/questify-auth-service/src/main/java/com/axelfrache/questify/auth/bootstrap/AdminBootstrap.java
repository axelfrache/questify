package com.axelfrache.questify.auth.bootstrap;

import com.axelfrache.questify.auth.model.InstanceSettings;
import com.axelfrache.questify.auth.model.Role;
import com.axelfrache.questify.auth.model.User;
import com.axelfrache.questify.auth.repository.InstanceSettingsRepository;
import com.axelfrache.questify.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements CommandLineRunner {

  private final UserRepository userRepository;
  private final InstanceSettingsRepository instanceSettingsRepository;
  private final PasswordEncoder passwordEncoder;

  @Value("${questify.admin.email:}")
  private String adminEmail;

  @Value("${questify.admin.password:}")
  private String adminPassword;

  @Override
  public void run(String... args) {
    initializeSettings();
    initializeAdminUser();
  }

  private void initializeSettings() {
    if (instanceSettingsRepository.count() == 0) {
      log.info("Initializing instance settings...");
      instanceSettingsRepository.save(
          InstanceSettings.builder().registrationEnabled(true).initialized(false).build());
    }
  }

  private void initializeAdminUser() {
    if (userRepository.count() != 0) return;

    if (adminEmail.isBlank() || adminPassword.isBlank()) {
      log.warn("Initial admin user not created: questify.admin.email/password are not set");
      return;
    }

    log.info("No users found. Creating initial admin user...");

    var admin =
        User.builder()
            .username("admin")
            .email(adminEmail)
            .password(passwordEncoder.encode(adminPassword))
            .role(Role.ADMIN)
            .build();

    userRepository.save(admin);
    log.info("Initial admin user created: {}", adminEmail);

    var settings = instanceSettingsRepository.findFirstByOrderByUpdatedAtDesc().orElseThrow();
    settings.setInitialized(true);
    instanceSettingsRepository.save(settings);
  }
}
