package com.axelfrache.questify.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.dto.QuestResponse;
import com.axelfrache.questify.security.SecurityUtils;
import com.axelfrache.questify.service.QuestService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;

class QuestOccurrenceControllerTest {

  private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID QUEST_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

  private QuestOccurrenceController controller;
  private QuestService questService;
  private SecurityUtils securityUtils;
  private UserDetails userDetails;

  @BeforeEach
  void setUp() {
    questService = mock(QuestService.class);
    securityUtils = mock(SecurityUtils.class);
    userDetails = mock(UserDetails.class);

    when(securityUtils.getCurrentUserId(userDetails)).thenReturn(USER_ID);

    controller = new QuestOccurrenceController(questService, securityUtils);
  }

  @Test
  void complete_shouldCallServiceWithCorrectParameters() {
    var expectedResponse =
        new QuestResponse(
            QUEST_ID, null, null, null, null, 0, 0, null, null, null, null, null, null, null, null,
            null, null, 0, 0);

    when(questService.complete(QUEST_ID, USER_ID)).thenReturn(expectedResponse);

    var response = controller.complete(userDetails, QUEST_ID);

    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals(expectedResponse, response.getBody());
    verify(questService).complete(QUEST_ID, USER_ID);
    verify(securityUtils).getCurrentUserId(userDetails);
  }

  @Test
  void skip_shouldCallServiceWithCorrectParameters() {
    var expectedResponse =
        new QuestResponse(
            QUEST_ID, null, null, null, null, 0, 0, null, null, null, null, null, null, null, null,
            null, null, 0, 0);

    when(questService.skip(QUEST_ID, USER_ID)).thenReturn(expectedResponse);

    var response = controller.skip(userDetails, QUEST_ID);

    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals(expectedResponse, response.getBody());
    verify(questService).skip(QUEST_ID, USER_ID);
    verify(securityUtils).getCurrentUserId(userDetails);
  }
}
