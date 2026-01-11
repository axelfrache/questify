package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.dto.CreateQuestRequest;
import com.axelfrache.questify.dto.UpdateQuestRequest;
import com.axelfrache.questify.model.*;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RecurringSubquestTest {

  private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  private QuestService questService;
  private QuestTemplateRepository questTemplateRepository;
  private QuestOccurrenceRepository questOccurrenceRepository;
  private UserRepository userRepository;
  private CategoryRepository categoryRepository;
  private ProgressionService progressionService;
  private com.axelfrache.questify.repository.QuestHistoryRepository questHistoryRepository;

  private User testUser;

  @BeforeEach
  void setUp() {
    questTemplateRepository = mock(QuestTemplateRepository.class);
    questOccurrenceRepository = mock(QuestOccurrenceRepository.class);
    userRepository = mock(UserRepository.class);
    categoryRepository = mock(CategoryRepository.class);
    progressionService = mock(ProgressionService.class);
    questHistoryRepository = mock(com.axelfrache.questify.repository.QuestHistoryRepository.class);

    questService =
        new QuestService(
            questTemplateRepository,
            questOccurrenceRepository,
            userRepository,
            categoryRepository,
            progressionService,
            questHistoryRepository);

    testUser = new User();
    testUser.setId(USER_ID);
    testUser.setTimezone("UTC");
  }

  @Test
  void create_shouldForbidRecurrence_whenParentIsRecurring() {
    var parentId = UUID.randomUUID();
    var parent = createTemplate();
    parent.setId(parentId);
    parent.setRecurrenceRule(RecurrenceRule.builder().type(RecurrenceType.DAILY).build());

    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));
    when(questTemplateRepository.findById(parentId)).thenReturn(Optional.of(parent));

    var request =
        new CreateQuestRequest(
            "Subquest",
            null,
            Difficulty.EASY,
            null,
            null,
            null,
            RecurrenceType.DAILY,
            null,
            parentId);

    assertThrows(IllegalArgumentException.class, () -> questService.create(USER_ID, request));
  }

  @Test
  void update_shouldForbidRecurrence_whenParentIsRecurring() {
    var parentId = UUID.randomUUID();
    var parent = createTemplate();
    parent.setId(parentId);
    parent.setRecurrenceRule(RecurrenceRule.builder().type(RecurrenceType.DAILY).build());

    var subquestId = UUID.randomUUID();
    var subquest = createTemplate();
    subquest.setId(subquestId);
    subquest.setParent(parent);

    when(questOccurrenceRepository.findByIdAndUserId(subquestId, USER_ID))
        .thenReturn(Optional.empty());
    when(questTemplateRepository.findByIdAndUserId(subquestId, USER_ID))
        .thenReturn(Optional.of(subquest));

    var request =
        new UpdateQuestRequest(null, null, null, null, null, null, RecurrenceType.DAILY, null);

    assertThrows(
        IllegalArgumentException.class, () -> questService.update(subquestId, USER_ID, request));
  }

  @Test
  void update_shouldForbidParentRecurrence_whenSubquestHasRecurrence() {
    var parentId = UUID.randomUUID();
    var parent = createTemplate();
    parent.setId(parentId);

    var subquest = createTemplate();
    subquest.setRecurrenceRule(RecurrenceRule.builder().type(RecurrenceType.WEEKLY).build());
    subquest.setParent(parent);
    subquest.setActive(true);
    subquest.setDeleted(false);

    parent.setSubquests(List.of(subquest));

    when(questOccurrenceRepository.findByIdAndUserId(parentId, USER_ID))
        .thenReturn(Optional.empty());
    when(questTemplateRepository.findByIdAndUserId(parentId, USER_ID))
        .thenReturn(Optional.of(parent));

    var request =
        new UpdateQuestRequest(null, null, null, null, null, null, RecurrenceType.DAILY, null);

    assertThrows(
        IllegalArgumentException.class, () -> questService.update(parentId, USER_ID, request));
  }

  @Test
  void ensureDailyOccurrences_shouldGenerateSubquestOccurrences() {
    var parent = createTemplate();
    parent.setRecurrenceRule(RecurrenceRule.builder().type(RecurrenceType.DAILY).build());

    var subquest = createTemplate();
    subquest.setTitle("Subquest");
    subquest.setParent(parent);
    subquest.setActive(true);

    parent.setSubquests(List.of(subquest));

    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));
    when(questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(testUser))
        .thenReturn(List.of(parent));

    when(questOccurrenceRepository.existsByQuestTemplateAndScheduledDate(
            eq(parent), any(LocalDate.class)))
        .thenReturn(false);
    when(questOccurrenceRepository.existsByQuestTemplateAndScheduledDate(
            eq(subquest), any(LocalDate.class)))
        .thenReturn(false);

    questService.ensureDailyOccurrences(USER_ID);

    verify(questOccurrenceRepository).save(argThat(o -> o.getQuestTemplate().equals(parent)));
    verify(questOccurrenceRepository).save(argThat(o -> o.getQuestTemplate().equals(subquest)));
  }

  @Test
  void findTodayQuests_shouldExcludeProjects() {
    var project = createTemplate();
    project.setTitle("Project");

    var subquest = createTemplate();
    subquest.setParent(project);
    project.setSubquests(List.of(subquest));

    var projectOccurrence =
        QuestOccurrence.builder()
            .questTemplate(project)
            .scheduledDate(LocalDate.now())
            .status(QuestStatus.PENDING)
            .build();

    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));
    when(questOccurrenceRepository.findAllByUserIdWithSubquests(USER_ID))
        .thenReturn(List.of(projectOccurrence));

    when(questOccurrenceRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

    var results = questService.findTodayQuests(USER_ID);

    assertTrue(results.isEmpty(), "Should exclude project from today's quests");
  }

  private QuestTemplate createTemplate() {
    var template = new QuestTemplate();
    template.setId(UUID.randomUUID());
    template.setTitle("Test Quest");
    template.setDifficulty(Difficulty.MEDIUM);
    template.setBaseXpReward(50);
    template.setActive(true);
    template.setDeleted(false);
    template.setUser(testUser);
    template.setCreatedAt(Instant.now());
    return template;
  }
}
