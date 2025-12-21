package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.model.QuestOccurrence;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.model.QuestTemplate;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserRepository;
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

    when(questOccurrenceRepository.existsById(templateId)).thenReturn(false);
    when(questTemplateRepository.findById(templateId)).thenReturn(Optional.of(template));

    questService.delete(templateId);

    assertTrue(template.isDeleted());
    assertFalse(template.isActive());
    verify(questTemplateRepository).save(template);

    verify(questOccurrenceRepository).deleteAll(List.of(pendingOccurrence));
  }
}
