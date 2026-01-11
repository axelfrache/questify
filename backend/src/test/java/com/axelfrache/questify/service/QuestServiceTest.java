package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.dto.CreateQuestRequest;
import com.axelfrache.questify.dto.ProgressionResult;
import com.axelfrache.questify.dto.UpdateQuestRequest;
import com.axelfrache.questify.model.*;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class QuestServiceTest {

  private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID OTHER_USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final UUID QUEST_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

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
  void create_shouldCreateTemplateOnly_whenNoRecurrenceAndNoDueDate() {
    var request =
        new CreateQuestRequest(
            "Test Quest", "Description", Difficulty.MEDIUM, 50, null, null, null, null, null);
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));

    var response = questService.create(USER_ID, request);

    assertNotNull(response);
    assertEquals("Test Quest", response.title());
    assertEquals(RecurrenceType.NONE, response.recurrenceInterval());
    verify(questTemplateRepository).save(any(QuestTemplate.class));
    verify(questOccurrenceRepository, never()).save(any(QuestOccurrence.class));
  }

  @Test
  void create_shouldCreateRecurringTemplate_whenDailyRecurrence() {
    var request =
        new CreateQuestRequest(
            "Daily Quest",
            "Description",
            Difficulty.EASY,
            25,
            null,
            null,
            RecurrenceType.DAILY,
            null,
            null);
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));
    when(questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(testUser))
        .thenReturn(List.of());

    var response = questService.create(USER_ID, request);

    assertNotNull(response);
    assertEquals(RecurrenceType.DAILY, response.recurrenceInterval());
    verify(questTemplateRepository).save(any(QuestTemplate.class));
  }

  @Test
  void create_shouldThrow_whenUserNotFound() {
    var request = new CreateQuestRequest("Test", null, null, null, null, null, null, null, null);
    when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class, () -> questService.create(USER_ID, request));
  }

  @Test
  void create_shouldCreateOccurrence_whenDueDateProvided() {
    var dueDate = Instant.now().plusSeconds(86400);
    var request =
        new CreateQuestRequest(
            "Scheduled Quest",
            "Description",
            Difficulty.MEDIUM,
            50,
            null,
            dueDate,
            null,
            null,
            null);
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));

    var response = questService.create(USER_ID, request);

    assertNotNull(response);
    assertEquals("Scheduled Quest", response.title());
    assertNotNull(response.dueDate());
    verify(questTemplateRepository).save(any(QuestTemplate.class));
    verify(questOccurrenceRepository).save(any(QuestOccurrence.class));
  }

  @Test
  void create_shouldUseDefaultDifficulty_whenNotProvided() {
    var request = new CreateQuestRequest("Test", null, null, null, null, null, null, null, null);
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));

    var response = questService.create(USER_ID, request);

    assertEquals(Difficulty.MEDIUM, response.difficulty());
  }

  @Test
  void complete_shouldAwardXp_whenPending() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));
    when(progressionService.awardXp(any(), anyInt(), anyString()))
        .thenReturn(
            new ProgressionResult(0, 50, 1, 1, Grade.INITIATE, Grade.INITIATE, false, false));

    var response = questService.complete(occurrenceId, USER_ID);

    assertEquals(QuestStatus.COMPLETED, response.status());
    assertNotNull(occurrence.getCompletedAt());
    verify(progressionService).awardXp(eq(USER_ID), anyInt(), anyString());
    verify(questOccurrenceRepository).save(occurrence);
    verify(questHistoryRepository).save(any(QuestHistory.class));
  }

  @Test
  void complete_shouldSaveToHistory_whenCompleted() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));
    when(progressionService.awardXp(any(), anyInt(), anyString()))
        .thenReturn(
            new ProgressionResult(0, 50, 1, 1, Grade.INITIATE, Grade.INITIATE, false, false));

    questService.complete(occurrenceId, USER_ID);

    verify(questHistoryRepository)
        .save(
            argThat(
                history ->
                    history.getUserId().equals(USER_ID)
                        && history.getOriginalQuestId().equals(template.getId())
                        && history.getTitle().equals(template.getTitle())
                        && history.getXpEarned() > 0));
  }

  @Test
  void complete_shouldThrow_whenAlreadyCompleted() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.COMPLETED, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    assertThrows(IllegalStateException.class, () -> questService.complete(occurrenceId, USER_ID));
  }

  @Test
  void complete_shouldThrow_whenFutureRecurringQuest() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    template.setRecurrenceRule(RecurrenceRule.builder().type(RecurrenceType.DAILY).build());
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now().plusDays(1));
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    assertThrows(IllegalStateException.class, () -> questService.complete(occurrenceId, USER_ID));
  }

  @Test
  void complete_shouldThrow_whenQuestNotOwnedByUser() {
    var occurrenceId = UUID.randomUUID();

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, OTHER_USER_ID))
        .thenReturn(Optional.empty());
    when(questTemplateRepository.findByIdAndUserId(occurrenceId, OTHER_USER_ID))
        .thenReturn(Optional.empty());

    assertThrows(
        IllegalArgumentException.class, () -> questService.complete(occurrenceId, OTHER_USER_ID));
  }

  @Test
  void skip_shouldMarkAsSkipped_whenPending() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    var response = questService.skip(occurrenceId, USER_ID);

    assertEquals(QuestStatus.SKIPPED, response.status());
    verify(questOccurrenceRepository).save(occurrence);
  }

  @Test
  void skip_shouldThrow_whenFutureQuest() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now().plusDays(1));
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    assertThrows(IllegalStateException.class, () -> questService.skip(occurrenceId, USER_ID));
  }

  @Test
  void skip_shouldThrow_whenAlreadyCompleted() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.COMPLETED, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    assertThrows(IllegalStateException.class, () -> questService.skip(occurrenceId, USER_ID));
  }

  @Test
  void cancel_shouldCancelOccurrence_whenOccurrenceExists() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    var response = questService.cancel(occurrenceId, USER_ID);

    assertEquals(QuestStatus.CANCELLED, response.status());
  }

  @Test
  void cancel_shouldDeactivateTemplate_whenTemplateId() {
    var templateId = UUID.randomUUID();
    var template = createTemplate();
    template.setId(templateId);

    when(questOccurrenceRepository.findByIdAndUserId(templateId, USER_ID))
        .thenReturn(Optional.empty());
    when(questTemplateRepository.findByIdAndUserId(templateId, USER_ID))
        .thenReturn(Optional.of(template));

    questService.cancel(templateId, USER_ID);

    assertFalse(template.isActive());
    verify(questTemplateRepository).save(template);
  }

  @Test
  void update_shouldModifyOccurrence_whenOccurrenceId() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    var request = new UpdateQuestRequest("New Title", null, null, null, null, null, null, null);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    var response = questService.update(occurrenceId, USER_ID, request);

    assertEquals("New Title", response.title());
    verify(questTemplateRepository).save(template);
  }

  @Test
  void update_shouldThrow_whenUpdatingDueDateOfCompletedQuest() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.COMPLETED, LocalDate.now());
    occurrence.setId(occurrenceId);

    var request =
        new UpdateQuestRequest(
            null, null, null, null, null, Instant.now().plusSeconds(86400), null, null);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    assertThrows(
        IllegalStateException.class, () -> questService.update(occurrenceId, USER_ID, request));
  }

  @Test
  void delete_shouldSoftDeleteTemplateAndCleanupPendingOccurrences() {
    var templateId = UUID.randomUUID();
    var template = new QuestTemplate();
    template.setId(templateId);
    template.setActive(true);
    template.setDeleted(false);
    template.setUser(testUser);

    var pendingOccurrence = new QuestOccurrence();
    pendingOccurrence.setStatus(QuestStatus.PENDING);
    pendingOccurrence.setQuestTemplate(template);

    var completedOccurrence = new QuestOccurrence();
    completedOccurrence.setStatus(QuestStatus.COMPLETED);
    completedOccurrence.setQuestTemplate(template);

    var occurrences = new ArrayList<QuestOccurrence>();
    occurrences.add(pendingOccurrence);
    occurrences.add(completedOccurrence);
    template.setOccurrences(occurrences);

    when(questOccurrenceRepository.findByIdAndUserId(templateId, USER_ID))
        .thenReturn(Optional.empty());
    when(questTemplateRepository.findByIdAndUserId(templateId, USER_ID))
        .thenReturn(Optional.of(template));

    questService.delete(templateId, USER_ID);

    assertTrue(template.isDeleted());
    assertFalse(template.isActive());
    verify(questTemplateRepository).save(template);
    verify(questOccurrenceRepository).deleteAll(occurrences);
  }

  @Test
  void delete_shouldDeleteOccurrenceAndTemplate_whenOccurrenceIdOfNonRecurringQuest() {
    var occurrenceId = UUID.randomUUID();
    var template = new QuestTemplate();
    template.setId(UUID.randomUUID());
    template.setActive(true);
    template.setDeleted(false);
    template.setRecurrenceRule(null);
    template.setUser(testUser);

    var occurrence = new QuestOccurrence();
    occurrence.setId(occurrenceId);
    occurrence.setQuestTemplate(template);
    occurrence.setStatus(QuestStatus.PENDING);

    var occurrences = new ArrayList<QuestOccurrence>();
    occurrences.add(occurrence);
    template.setOccurrences(occurrences);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    questService.delete(occurrenceId, USER_ID);

    verify(questOccurrenceRepository).delete(occurrence);
    verify(questOccurrenceRepository).deleteAll(occurrences);
    verify(questTemplateRepository).save(template);
    assertTrue(template.isDeleted());
  }

  @Test
  void findTodayQuests_shouldExcludeSkipped() {
    var template = createTemplate();
    var pendingOccurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    var skippedOccurrence = createOccurrence(template, QuestStatus.SKIPPED, LocalDate.now());

    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));
    when(questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(testUser))
        .thenReturn(List.of());
    when(questOccurrenceRepository.findAllByUserIdWithSubquests(USER_ID))
        .thenReturn(List.of(pendingOccurrence, skippedOccurrence));

    var quests = questService.findTodayQuests(USER_ID);

    assertEquals(1, quests.size());
    assertEquals(QuestStatus.PENDING, quests.get(0).status());
  }

  @Test
  void toggleActive_shouldToggleTemplateState() {
    var templateId = UUID.randomUUID();
    var template = createTemplate();
    template.setId(templateId);
    template.setActive(true);

    when(questTemplateRepository.findByIdAndUserId(templateId, USER_ID))
        .thenReturn(Optional.of(template));

    questService.toggleActive(templateId, USER_ID);

    assertFalse(template.isActive());
    verify(questTemplateRepository).save(template);
  }

  @Test
  void findById_shouldReturnOccurrence_whenOccurrenceExists() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findByIdAndUserId(occurrenceId, USER_ID))
        .thenReturn(Optional.of(occurrence));

    var response = questService.findById(occurrenceId, USER_ID);

    assertNotNull(response);
    assertEquals(occurrenceId, response.id());
  }

  @Test
  void findById_shouldReturnTemplate_whenOnlyTemplateExists() {
    var templateId = UUID.randomUUID();
    var template = createTemplate();
    template.setId(templateId);

    when(questOccurrenceRepository.findByIdAndUserId(templateId, USER_ID))
        .thenReturn(Optional.empty());
    when(questTemplateRepository.findByIdAndUserId(templateId, USER_ID))
        .thenReturn(Optional.of(template));

    var response = questService.findById(templateId, USER_ID);

    assertNotNull(response);
    assertEquals(templateId, response.id());
  }

  @Test
  void findById_shouldThrow_whenNotOwner() {
    var templateId = UUID.randomUUID();

    when(questOccurrenceRepository.findByIdAndUserId(templateId, OTHER_USER_ID))
        .thenReturn(Optional.empty());
    when(questTemplateRepository.findByIdAndUserId(templateId, OTHER_USER_ID))
        .thenReturn(Optional.empty());

    assertThrows(
        IllegalArgumentException.class, () -> questService.findById(templateId, OTHER_USER_ID));
  }

  @Test
  void delete_shouldDeleteProjectAndSubquests() {
    var projectId = UUID.randomUUID();
    var subquestId = UUID.randomUUID();
    var projectTemplate = new QuestTemplate();
    projectTemplate.setId(projectId);
    projectTemplate.setTitle("Project");
    projectTemplate.setSubquests(new ArrayList<>());
    projectTemplate.setUser(testUser);

    var subquestTemplate = new QuestTemplate();
    subquestTemplate.setId(subquestId);
    subquestTemplate.setTitle("Subquest");
    subquestTemplate.setParent(projectTemplate);
    subquestTemplate.setUser(testUser);
    projectTemplate.getSubquests().add(subquestTemplate);

    when(questOccurrenceRepository.findByIdAndUserId(projectId, USER_ID))
        .thenReturn(Optional.empty());
    when(questTemplateRepository.findByIdAndUserId(projectId, USER_ID))
        .thenReturn(Optional.of(projectTemplate));

    questService.delete(projectId, USER_ID);

    verify(questTemplateRepository).save(projectTemplate);
    verify(questTemplateRepository).save(subquestTemplate);
    assertTrue(projectTemplate.isDeleted());
    assertTrue(subquestTemplate.isDeleted());
  }

  @Test
  void update_shouldCreateOccurrence_whenDueDateAddedToFloatingQuest() {
    var templateId = UUID.randomUUID();
    var template = createTemplate();
    template.setId(templateId);
    var dueDate = Instant.now().plusSeconds(86400);
    var request = new UpdateQuestRequest(null, null, null, null, null, dueDate, null, null);

    when(questOccurrenceRepository.findByIdAndUserId(templateId, USER_ID))
        .thenReturn(Optional.empty());
    when(questTemplateRepository.findByIdAndUserId(templateId, USER_ID))
        .thenReturn(Optional.of(template));
    when(questOccurrenceRepository.findByQuestTemplateAndScheduledDate(any(), any()))
        .thenReturn(Optional.empty());

    var response = questService.update(templateId, USER_ID, request);

    verify(questOccurrenceRepository).save(any(QuestOccurrence.class));
    assertNotNull(response);
    assertTrue(response.id() != templateId);
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

  private QuestOccurrence createOccurrence(
      QuestTemplate template, QuestStatus status, LocalDate date) {
    var occurrence = new QuestOccurrence();
    occurrence.setId(UUID.randomUUID());
    occurrence.setQuestTemplate(template);
    occurrence.setStatus(status);
    occurrence.setScheduledDate(date);
    return occurrence;
  }
}
