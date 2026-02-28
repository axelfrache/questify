package com.axelfrache.questify.service;

import com.axelfrache.questify.model.QuestHistory;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.model.RecurrenceType;
import com.axelfrache.questify.repository.QuestHistoryRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class HistoryMigrationService implements CommandLineRunner {

  private final QuestOccurrenceRepository questOccurrenceRepository;
  private final QuestHistoryRepository questHistoryRepository;

  @Override
  @Transactional
  public void run(String... args) {
    if (questHistoryRepository.count() > 0) {
      log.info("Quest history already populated, skipping migration.");
      return;
    }

    log.info("Starting migration of completed quests to history...");

    var completedOccurrences =
        questOccurrenceRepository.findAll().stream()
            .filter(q -> q.getStatus() == QuestStatus.COMPLETED)
            .toList();

    int count = 0;
    for (var occurrence : completedOccurrences) {
      var template = occurrence.getQuestTemplate();

      if (template == null) continue;

      var history =
          QuestHistory.builder()
              .userId(template.getUser().getId())
              .originalQuestId(template.getId())
              .title(template.getTitle())
              .description(template.getDescription())
              .difficulty(template.getDifficulty())
              .xpEarned(occurrence.getXpEarned())
              .completedAt(occurrence.getCompletedAt())
              .categoryName(
                  template.getCategory() != null ? template.getCategory().getName() : null)
              .categoryIcon(
                  template.getCategory() != null ? template.getCategory().getIcon() : null)
              .categoryColor(
                  template.getCategory() != null ? template.getCategory().getColor() : null)
              .recurrenceType(
                  template.getRecurrenceRule() != null
                      ? template.getRecurrenceRule().getType()
                      : RecurrenceType.NONE)
              .parentTitle(template.getParent() != null ? template.getParent().getTitle() : null)
              .build();

      questHistoryRepository.save(history);
      count++;
    }

    log.info("Successfully migrated {} completed quests to history.", count);
  }
}
