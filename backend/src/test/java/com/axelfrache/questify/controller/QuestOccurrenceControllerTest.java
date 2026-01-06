package com.axelfrache.questify.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.axelfrache.questify.dto.QuestResponse;
import com.axelfrache.questify.security.JwtAuthenticationFilter;
import com.axelfrache.questify.security.JwtService;
import com.axelfrache.questify.security.UserDetailsServiceImpl;
import com.axelfrache.questify.service.QuestService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class QuestOccurrenceControllerTest {

  private MockMvc mockMvc;
  private QuestService questService;
  private JwtService jwtService;
  private UserDetailsServiceImpl userDetailsService;

  @BeforeEach
  void setUp() {
    questService = mock(QuestService.class);
    jwtService = mock(JwtService.class);
    userDetailsService = mock(UserDetailsServiceImpl.class);

    var jwtFilter = new JwtAuthenticationFilter(jwtService, userDetailsService);
    var controller = new QuestOccurrenceController(questService);

    mockMvc = MockMvcBuilders.standaloneSetup(controller).addFilters(jwtFilter).build();
  }

  @Test
  void complete_shouldReturnOk_whenTokenIsValid() throws Exception {
    var id = UUID.randomUUID();
    var token = "valid-token";
    var username = "user@example.com";
    var userDetails =
        User.builder().username(username).password("password").authorities("ROLE_USER").build();

    when(jwtService.extractUsername(token)).thenReturn(username);
    when(userDetailsService.loadUserByUsername(username)).thenReturn(userDetails);
    when(jwtService.isTokenValid(token, userDetails)).thenReturn(true);
    when(questService.complete(id))
        .thenReturn(
            new QuestResponse(
                id, null, null, null, null, 0, 0, null, null, null, null, null, null, null, null,
                null, null, 0, 0));

    mockMvc
        .perform(
            post("/api/occurrences/" + id + "/complete").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());
  }
}
