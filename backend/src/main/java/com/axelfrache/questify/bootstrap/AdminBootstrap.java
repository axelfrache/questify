package com.axelfrache.questify.bootstrap;

import com.axelfrache.questify.model.InstanceSettings;
import com.axelfrache.questify.model.Role;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.InstanceSettingsRepository;
import com.axelfrache.questify.repository.UserRepository;
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

    @Value("${questify.admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${questify.admin.password:admin}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        initializeSettings();
        initializeAdminUser();
    }

    private void initializeSettings() {
        if (instanceSettingsRepository.count() == 0) {
            log.info("Initializing instance settings...");
            instanceSettingsRepository.save(
                    InstanceSettings.builder()
                            .registrationEnabled(true)
                            .initialized(false)
                            .build());
        }
    }

    private void initializeAdminUser() {
        if (userRepository.count() == 0) {
            log.info("No users found. Creating initial admin user...");

            User admin = User.builder()
                    .username("admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .build();

            userRepository.save(admin);

            log.info("=================================================");
            log.info("ADMIN USER CREATED");
            log.info("Email: {}", adminEmail);
            log.info("Password: {}", adminPassword);
            log.info("PLEASE CHANGE THIS PASSWORD IMMEDIATELY AFTER LOGIN");
            log.info("=================================================");

            InstanceSettings settings = instanceSettingsRepository.findFirstByOrderByUpdatedAtDesc()
                    .orElseThrow();
            settings.setInitialized(true);
            instanceSettingsRepository.save(settings);
        }
    }

}
