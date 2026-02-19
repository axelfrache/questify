package com.axelfrache.questify.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.axelfrache.questify.model.InstanceSettings;
import com.axelfrache.questify.model.Role;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.InstanceSettingsRepository;
import com.axelfrache.questify.repository.UserRepository;
import com.axelfrache.questify.security.JwtService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collections;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

@SpringBootTest
class AdminControllerTest {

        private MockMvc mockMvc;
        @Autowired
        private WebApplicationContext context;
        @Autowired
        private UserRepository userRepository;
        @Autowired
        private InstanceSettingsRepository instanceSettingsRepository;
        @Autowired
        private JwtService jwtService;

        private String adminToken;
        private String userToken;

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders
                                .webAppContextSetup(context)
                                .apply(springSecurity())
                                .build();

                userRepository.deleteAll();
                instanceSettingsRepository.deleteAll();

                // Create settings
                instanceSettingsRepository.save(
                                InstanceSettings.builder().registrationEnabled(true).initialized(true).build());

                // Create Admin
                var admin = User.builder()
                                .username("admin")
                                .email("admin@test.com")
                                .password("password")
                                .role(Role.ADMIN)
                                .build();
                userRepository.save(admin);

                var adminDetails = new org.springframework.security.core.userdetails.User(
                                admin.getEmail(),
                                admin.getPassword(),
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")));
                adminToken = jwtService.generateAccessToken(adminDetails);

                // Create User
                var user = User.builder()
                                .username("user")
                                .email("user@test.com")
                                .password("password")
                                .role(Role.USER)
                                .build();
                userRepository.save(user);

                UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                                user.getEmail(),
                                user.getPassword(),
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
                userToken = jwtService.generateAccessToken(userDetails);
        }

        @Test
        void getSettings_ShouldSucceedForAdmin() throws Exception {
                mockMvc
                                .perform(get("/api/admin/settings").header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.registrationEnabled").value(true));
        }

        @Test
        void getSettings_ShouldFailForUser() throws Exception {
                mockMvc
                                .perform(get("/api/admin/settings").header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isForbidden());
        }

        @Test
        void updateSettings_ShouldSucceedForAdmin() throws Exception {
                mockMvc
                                .perform(
                                                patch("/api/admin/settings")
                                                                .header("Authorization", "Bearer " + adminToken)
                                                                .contentType(MediaType.APPLICATION_JSON)
                                                                .content("{\"registrationEnabled\": false}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.registrationEnabled").value(false));
        }
}
