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

  private QuestService questService;
  private QuestTemplateRepository questTemplateRepository;
  private QuestOccurrenceRepository questOccurrenceRepository;
  private UserRepository userRepository;
  private CategoryRepository categoryRepository;
  private ProgressionService progressionService;

  private User testUser;
  private UUID userId;

  @BeforeEach
  void setUp() {
    questTemplateRepository = mock(QuestTemplateRepository.class);
    questOccurrenceRepository = mock(QuestOccurrenceRepository.class);
    userRepository = mock(UserRepository.class);
    categoryRepository = mock(CategoryRepository.class);
    progressionService = mock(ProgressionService.class);

    questService =
        new QuestService(
            questTemplateRepository,
            questOccurrenceRepository,
            userRepository,
            categoryRepository,
            progressionService);

    userId = UUID.randomUUID();
    testUser = new User();
    testUser.setId(userId);
    testUser.setTimezone("UTC");
  }

  @Test
  void create_shouldCreateTemplateAndOccurrence_whenNoRecurrenceAndNoDueDate() {
    var request =
        new CreateQuestRequest(
            "Test Quest", "Description", Difficulty.MEDIUM, 50, null, null, null, null, null);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var response = questService.create(userId, request);

    assertNotNull(response);
    assertEquals("Test Quest", response.title());
    assertEquals(RecurrenceType.NONE, response.recurrenceInterval());
    verify(questTemplateRepository).save(any(QuestTemplate.class));
    verify(questOccurrenceRepository).save(any(QuestOccurrence.class));
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
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(testUser))
        .thenReturn(List.of());

    var response = questService.create(userId, request);

    assertNotNull(response);
    assertEquals(RecurrenceType.DAILY, response.recurrenceInterval());
    verify(questTemplateRepository).save(any(QuestTemplate.class));
  }

  @Test
  void create_shouldThrow_whenUserNotFound() {
    var request = new CreateQuestRequest("Test", null, null, null, null, null, null, null, null);
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class, () -> questService.create(userId, request));
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
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var response = questService.create(userId, request);

    assertNotNull(response);
    assertEquals("Scheduled Quest", response.title());
    assertNotNull(response.dueDate());
    verify(questTemplateRepository).save(any(QuestTemplate.class));
    verify(questOccurrenceRepository).save(any(QuestOccurrence.class));
  }

  @Test
  void create_shouldUseDefaultDifficulty_whenNotProvided() {
    var request = new CreateQuestRequest("Test", null, null, null, null, null, null, null, null);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var response = questService.create(userId, request);

    assertEquals(Difficulty.MEDIUM, response.difficulty());
  }

  @Test
  void complete_shouldAwardXp_whenPending() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));
    when(progressionService.awardXp(any(), anyInt(), anyString()))
        .thenReturn(
            new ProgressionResult(0, 50, 1, 1, Grade.INITIATE, Grade.INITIATE, false, false));

    var response = questService.complete(occurrenceId);

    assertEquals(QuestStatus.COMPLETED, response.status());
    assertNotNull(occurrence.getCompletedAt());
    verify(progressionService).awardXp(eq(userId), anyInt(), anyString());
    verify(questOccurrenceRepository).save(occurrence);
  }

  @Test
  void complete_shouldThrow_whenAlreadyCompleted() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.COMPLETED, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    assertThrows(IllegalStateException.class, () -> questService.complete(occurrenceId));
  }

  @Test
  void complete_shouldThrow_whenFutureRecurringQuest() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    template.setRecurrenceRule(RecurrenceRule.builder().type(RecurrenceType.DAILY).build());
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now().plusDays(1));
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    assertThrows(IllegalStateException.class, () -> questService.complete(occurrenceId));
  }

  @Test
  void skip_shouldMarkAsSkipped_whenPending() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    var response = questService.skip(occurrenceId);

    assertEquals(QuestStatus.SKIPPED, response.status());
    verify(questOccurrenceRepository).save(occurrence);
  }

  @Test
  void skip_shouldThrow_whenFutureQuest() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now().plusDays(1));
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    assertThrows(IllegalStateException.class, () -> questService.skip(occurrenceId));
  }

  @Test
  void skip_shouldThrow_whenAlreadyCompleted() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.COMPLETED, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    assertThrows(IllegalStateException.class, () -> questService.skip(occurrenceId));
  }

  @Test
  void cancel_shouldCancelOccurrence_whenOccurrenceExists() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    var response = questService.cancel(occurrenceId);

    assertEquals(QuestStatus.CANCELLED, response.status());
  }

  @Test
  void cancel_shouldDeactivateTemplate_whenTemplateId() {
    var templateId = UUID.randomUUID();
    var template = createTemplate();
    template.setId(templateId);

    when(questOccurrenceRepository.findById(templateId)).thenReturn(Optional.empty());
    when(questTemplateRepository.findById(templateId)).thenReturn(Optional.of(template));

    questService.cancel(templateId);

    assertFalse(template.isActive());
    verify(questTemplateRepository).save(template);
  }

  @Test
  void update_shouldModifyOccurrence_whenOccurrenceId() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    var request = new UpdateQuestRequest("New Title", null, null, null, null, null, null);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    var response = questService.update(occurrenceId, request);

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
            null, null, null, null, Instant.now().plusSeconds(86400), null, null);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    assertThrows(IllegalStateException.class, () -> questService.update(occurrenceId, request));
  }

  @Test
  void delete_shouldSoftDeleteTemplateAndCleanupPendingOccurrences() {
    var templateId = UUID.randomUUID();
    var template = new QuestTemplate();
    template.setId(templateId);
    template.setActive(true);
    template.setDeleted(false);

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

    when(questOccurrenceRepository.findById(templateId)).thenReturn(Optional.empty());
    when(questTemplateRepository.findById(templateId)).thenReturn(Optional.of(template));

    questService.delete(templateId);

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

    var occurrence = new QuestOccurrence();
    occurrence.setId(occurrenceId);
    occurrence.setQuestTemplate(template);
    occurrence.setStatus(QuestStatus.PENDING);

    var occurrences = new ArrayList<QuestOccurrence>();
    occurrences.add(occurrence);
    template.setOccurrences(occurrences);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    questService.delete(occurrenceId);

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

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(testUser))
        .thenReturn(List.of());
    when(questOccurrenceRepository.findAllByUserId(userId))
        .thenReturn(List.of(pendingOccurrence, skippedOccurrence));

    var quests = questService.findTodayQuests(userId);

    assertEquals(1, quests.size());
    assertEquals(QuestStatus.PENDING, quests.get(0).status());
  }

  @Test
  void toggleActive_shouldToggleTemplateState() {
    var templateId = UUID.randomUUID();
    var template = createTemplate();
    template.setId(templateId);
    template.setActive(true);

    when(questTemplateRepository.findById(templateId)).thenReturn(Optional.of(template));

    questService.toggleActive(templateId);

    assertFalse(template.isActive());
    verify(questTemplateRepository).save(template);
  }

  @Test
  void findById_shouldReturnOccurrence_whenOccurrenceExists() {
    var occurrenceId = UUID.randomUUID();
    var template = createTemplate();
    var occurrence = createOccurrence(template, QuestStatus.PENDING, LocalDate.now());
    occurrence.setId(occurrenceId);

    when(questOccurrenceRepository.findById(occurrenceId)).thenReturn(Optional.of(occurrence));

    var response = questService.findById(occurrenceId);

    assertNotNull(response);
    assertEquals(occurrenceId, response.id());
  }

  @Test
  void findById_shouldReturnTemplate_whenOnlyTemplateExists() {
    var templateId = UUID.randomUUID();
    var template = createTemplate();
    template.setId(templateId);

    when(questOccurrenceRepository.findById(templateId)).thenReturn(Optional.empty());
    when(questTemplateRepository.findById(templateId)).thenReturn(Optional.of(template));

    var response = questService.findById(templateId);

    assertNotNull(response);
    assertEquals(templateId, response.id());
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
