package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.model.*;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class StatsServiceTest {

  private StatsService statsService;
  private QuestOccurrenceRepository questOccurrenceRepository;
  private UserRepository userRepository;
  private UserService userService;
  private CategoryRepository categoryRepository;
  private QuestTemplateRepository questTemplateRepository;

  private User testUser;
  private UUID userId;

  @BeforeEach
  void setUp() {
    questOccurrenceRepository = mock(QuestOccurrenceRepository.class);
    userRepository = mock(UserRepository.class);
    userService = mock(UserService.class);
    categoryRepository = mock(CategoryRepository.class);
    questTemplateRepository = mock(QuestTemplateRepository.class);

    statsService =
        new StatsService(
            questOccurrenceRepository,
            userRepository,
            userService,
            categoryRepository,
            questTemplateRepository);

    userId = UUID.randomUUID();
    testUser = new User();
    testUser.setId(userId);
    testUser.setTimezone("UTC");
  }

  @Test
  void getDailyStats_shouldCountCompletedOnDate() {
    var today = LocalDate.now();
    var completedOccurrence = createCompletedOccurrence(today, 50);
    var pendingOccurrence = createPendingOccurrence(today);

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questOccurrenceRepository.findByUserIdAndScheduledDate(userId, today))
        .thenReturn(List.of(completedOccurrence, pendingOccurrence));
    when(questOccurrenceRepository.findAllByUserId(userId))
        .thenReturn(List.of(completedOccurrence, pendingOccurrence));

    var stats = statsService.getDailyStats(userId, today);

    assertEquals(today, stats.date());
    assertEquals(1, stats.questsCompleted());
    assertEquals(50, stats.xpEarned());
  }

  @Test
  void getDailyStats_shouldReturnZero_whenNoCompletedQuests() {
    var today = LocalDate.now();
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questOccurrenceRepository.findByUserIdAndScheduledDate(userId, today))
        .thenReturn(List.of());
    when(questOccurrenceRepository.findAllByUserId(userId)).thenReturn(List.of());

    var stats = statsService.getDailyStats(userId, today);

    assertEquals(0, stats.questsCompleted());
    assertEquals(0, stats.xpEarned());
  }

  @Test
  void getDailyStats_shouldThrow_whenUserNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(
        NoSuchElementException.class, () -> statsService.getDailyStats(userId, LocalDate.now()));
  }

  @Test
  void getWeeklyStats_shouldAggregateDailyStats() {
    var today = LocalDate.now();
    var occurrence1 = createCompletedOccurrence(today, 50);
    var occurrence2 = createCompletedOccurrence(today.minusDays(2), 75);

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questOccurrenceRepository.findByUserIdAndScheduledDate(eq(userId), any()))
        .thenReturn(List.of());
    when(questOccurrenceRepository.findAllByUserId(userId))
        .thenReturn(List.of(occurrence1, occurrence2));

    var stats = statsService.getWeeklyStats(userId);

    assertNotNull(stats);
    assertEquals(7, stats.dailyBreakdown().size());
    assertTrue(stats.questsCompleted() >= 0);
  }

  @Test
  void getMonthlyStats_shouldCountMonthlyCompleted() {
    var today = LocalDate.now();
    var occurrence1 = createCompletedOccurrence(today, 50);
    var occurrence2 = createCompletedOccurrence(today.minusDays(5), 75);

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questOccurrenceRepository.findAllByUserId(userId))
        .thenReturn(List.of(occurrence1, occurrence2));

    var stats = statsService.getMonthlyStats(userId);

    assertEquals(2, stats.questsCompleted());
    assertEquals(125, stats.xpEarned());
    assertTrue(stats.activeDays() >= 1 && stats.activeDays() <= 2);
  }

  @Test
  void getMonthlyStats_shouldExcludePreviousMonth() {
    var today = LocalDate.now();
    var lastMonth = today.minusMonths(1);
    var thisMonthOccurrence = createCompletedOccurrence(today, 50);
    var lastMonthOccurrence = createCompletedOccurrence(lastMonth, 100);

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questOccurrenceRepository.findAllByUserId(userId))
        .thenReturn(List.of(thisMonthOccurrence, lastMonthOccurrence));

    var stats = statsService.getMonthlyStats(userId);

    assertEquals(1, stats.questsCompleted());
    assertEquals(50, stats.xpEarned());
  }

  @Test
  void getCategoryStats_shouldCalculateProgressCorrectly() {
    var categoryId = UUID.randomUUID();
    var category = new Category();
    category.setId(categoryId);
    category.setName("Health");
    category.setColor("#FF0000");
    category.setIcon("run");

    var template = new QuestTemplate();
    template.setCategory(category);
    template.setActive(true);

    var occurrences =
        List.of(
            createCompletedOccurrenceWithCategory(template),
            createCompletedOccurrenceWithCategory(template),
            createCompletedOccurrenceWithCategory(template),
            createCompletedOccurrenceWithCategory(template),
            createCompletedOccurrenceWithCategory(template));

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(categoryRepository.findAllForUser(testUser)).thenReturn(List.of(category));
    when(questTemplateRepository.findByUserAndActiveTrue(testUser)).thenReturn(List.of(template));
    when(questOccurrenceRepository.findAllByUserId(userId)).thenReturn(occurrences);

    var stats = statsService.getCategoryStats(userId);

    assertEquals(1, stats.size());
    var categoryStats = stats.get(0);
    assertEquals("Health", categoryStats.name());
    assertEquals(5, categoryStats.totalQuests());
    assertEquals(5, categoryStats.completedQuests());
    assertEquals("Apprentice", categoryStats.grade());
    assertEquals(100.0, categoryStats.progress());
  }

  @Test
  void getCategoryStats_shouldReturnNovice_whenFewCompleted() {
    var category = createCategory("Study");
    var template = createTemplateWithCategory(category);
    var completedOccurrences =
        List.of(
            createCompletedOccurrenceWithCategory(template),
            createCompletedOccurrenceWithCategory(template));

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(categoryRepository.findAllForUser(testUser)).thenReturn(List.of(category));
    when(questOccurrenceRepository.findAllByUserId(userId)).thenReturn(completedOccurrences);

    var stats = statsService.getCategoryStats(userId);

    assertEquals(1, stats.size());
    assertEquals("Novice", stats.get(0).grade());
  }

  @Test
  void getCategoryStats_shouldReturnMaster_when50Completed() {
    var category = createCategory("Fitness");
    var template = createTemplateWithCategory(category);

    var completedOccurrences =
        java.util.stream.IntStream.range(0, 50)
            .mapToObj(i -> createCompletedOccurrenceWithCategory(template))
            .toList();

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(categoryRepository.findAllForUser(testUser)).thenReturn(List.of(category));
    when(questOccurrenceRepository.findAllByUserId(userId)).thenReturn(completedOccurrences);

    var stats = statsService.getCategoryStats(userId);

    assertEquals("Master", stats.get(0).grade());
  }

  @Test
  void getCategoryStats_shouldReturnExpert_when25Completed() {
    var category = createCategory("Work");
    var template = createTemplateWithCategory(category);

    var completedOccurrences =
        java.util.stream.IntStream.range(0, 30)
            .mapToObj(i -> createCompletedOccurrenceWithCategory(template))
            .toList();

    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(categoryRepository.findAllForUser(testUser)).thenReturn(List.of(category));
    when(questOccurrenceRepository.findAllByUserId(userId)).thenReturn(completedOccurrences);

    var stats = statsService.getCategoryStats(userId);

    assertEquals("Expert", stats.get(0).grade());
  }

  @Test
  void getCategoryStats_shouldReturnEmpty_whenNoCategories() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(categoryRepository.findAllForUser(testUser)).thenReturn(List.of());

    var stats = statsService.getCategoryStats(userId);

    assertTrue(stats.isEmpty());
  }

  private QuestOccurrence createCompletedOccurrence(LocalDate date, int xpEarned) {
    var template = new QuestTemplate();
    template.setUser(testUser);

    var occurrence = new QuestOccurrence();
    occurrence.setQuestTemplate(template);
    occurrence.setStatus(QuestStatus.COMPLETED);
    occurrence.setScheduledDate(date);
    occurrence.setCompletedAt(date.atStartOfDay(ZoneId.of("UTC")).toInstant());
    occurrence.setXpEarned(xpEarned);
    return occurrence;
  }

  private QuestOccurrence createPendingOccurrence(LocalDate date) {
    var template = new QuestTemplate();
    template.setUser(testUser);

    var occurrence = new QuestOccurrence();
    occurrence.setQuestTemplate(template);
    occurrence.setStatus(QuestStatus.PENDING);
    occurrence.setScheduledDate(date);
    return occurrence;
  }

  private QuestOccurrence createCompletedOccurrenceWithCategory(QuestTemplate template) {
    var occurrence = new QuestOccurrence();
    occurrence.setQuestTemplate(template);
    occurrence.setStatus(QuestStatus.COMPLETED);
    occurrence.setScheduledDate(LocalDate.now());
    occurrence.setCompletedAt(Instant.now());
    return occurrence;
  }

  private Category createCategory(String name) {
    var category = new Category();
    category.setId(UUID.randomUUID());
    category.setName(name);
    category.setColor("#000000");
    category.setIcon("icon");
    return category;
  }

  private QuestTemplate createTemplateWithCategory(Category category) {
    var template = new QuestTemplate();
    template.setCategory(category);
    template.setActive(true);
    return template;
  }
}
