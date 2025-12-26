package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.axelfrache.questify.model.Category;
import com.axelfrache.questify.model.QuestOccurrence;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.model.QuestTemplate;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.util.List;
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
  }

  @Test
  void getCategoryStats_shouldCalculateProgressCorrectly() {
    var userId = UUID.randomUUID();
    var user = new User();
    user.setId(userId);

    var categoryId = UUID.randomUUID();
    var category = new Category();
    category.setId(categoryId);
    category.setName("Health");
    category.setColor("#FF0000");
    category.setIcon("run");

    var template = new QuestTemplate();
    template.setCategory(category);
    template.setActive(true);

    // 5 completed occurrences
    var occurrences =
        List.of(
            createCompletedOccurrence(template),
            createCompletedOccurrence(template),
            createCompletedOccurrence(template),
            createCompletedOccurrence(template),
            createCompletedOccurrence(template));

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(categoryRepository.findAllForUser(user)).thenReturn(List.of(category));
    when(questTemplateRepository.findByUserAndActiveTrue(user)).thenReturn(List.of(template));
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

  private QuestOccurrence createCompletedOccurrence(QuestTemplate template) {
    var occurrence = new QuestOccurrence();
    occurrence.setQuestTemplate(template);
    occurrence.setStatus(QuestStatus.COMPLETED);
    return occurrence;
  }
}
