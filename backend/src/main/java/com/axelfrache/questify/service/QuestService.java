package com.axelfrache.questify.service;

import com.axelfrache.questify.dto.CategoryResponse;
import com.axelfrache.questify.dto.CreateQuestRequest;
import com.axelfrache.questify.dto.QuestResponse;
import com.axelfrache.questify.dto.UpdateQuestRequest;
import com.axelfrache.questify.model.*;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuestService {

  private final QuestTemplateRepository questTemplateRepository;
  private final QuestOccurrenceRepository questOccurrenceRepository;
  private final UserRepository userRepository;
  private final CategoryRepository categoryRepository;
  private final ProgressionService progressionService;

  @Transactional
  public QuestResponse create(UUID userId, CreateQuestRequest request) {
    var user = findUserOrThrow(userId);

    var category = request.categoryId() != null
        ? categoryRepository.findById(request.categoryId()).orElse(null)
        : null;

    RecurrenceRule recurrenceRule = null;
    if (request.recurrenceInterval() != null && request.recurrenceInterval() != RecurrenceType.NONE) {
      recurrenceRule = RecurrenceRule.builder()
          .type(request.recurrenceInterval())
          .interval(1) // Default to 1 for now
          .build();
    }

    var template = QuestTemplate.builder()
        .title(request.title())
        .description(request.description())
        .difficulty(request.difficulty() != null ? request.difficulty() : Difficulty.MEDIUM)
        .baseXpReward(request.baseXpReward() != null ? request.baseXpReward() : 50)
        .category(category)
        .user(user)
        .recurrenceRule(recurrenceRule)
        .active(true)
        .build();

    questTemplateRepository.save(template);

    // If due date is provided OR it's recurring, create the first occurrence
    if (request.dueDate() != null || recurrenceRule != null) {
      LocalDate scheduledDate = request.dueDate() != null
          ? request.dueDate().atZone(ZoneId.systemDefault()).toLocalDate()
          : LocalDate.now();

      var occurrence = QuestOccurrence.builder()
          .questTemplate(template)
          .scheduledDate(scheduledDate)
          .status(QuestStatus.PENDING)
          .build();

      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

    return toResponse(template);
  }

  @Transactional
  public QuestResponse update(UUID id, UpdateQuestRequest request) {
    // Try to find occurrence first
    var occurrenceOpt = questOccurrenceRepository.findById(id);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();
      if (occurrence.getStatus() != QuestStatus.PENDING) {
        throw new IllegalStateException("Cannot update a completed or cancelled quest");
      }

      if (request.dueDate() != null) {
        occurrence.setScheduledDate(request.dueDate().atZone(ZoneId.systemDefault()).toLocalDate());
      }

      // Update template fields if provided
      var template = occurrence.getQuestTemplate();
      boolean templateUpdated = false;
      if (request.title() != null) {
        template.setTitle(request.title());
        templateUpdated = true;
      }
      if (request.description() != null) {
        template.setDescription(request.description());
        templateUpdated = true;
      }
      if (request.difficulty() != null) {
        template.setDifficulty(request.difficulty());
        templateUpdated = true;
      }

      if (templateUpdated) {
        questTemplateRepository.save(template);
      }

      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

    // Try to find template
    var template = findTemplateOrThrow(id);
    if (request.title() != null)
      template.setTitle(request.title());
    if (request.description() != null)
      template.setDescription(request.description());
    if (request.difficulty() != null)
      template.setDifficulty(request.difficulty());
    // Updating recurrence or due date on a template that is already created is
    // complex.
    // For now, we ignore recurrence updates on existing templates to keep it
    // simple.

    questTemplateRepository.save(template);
    return toResponse(template);
  }

  @Transactional
  public QuestResponse complete(UUID id) {
    // We expect an occurrence ID
    var occurrence = findOccurrenceOrThrow(id);

    if (occurrence.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed or cancelled");

    occurrence.setStatus(QuestStatus.COMPLETED);
    occurrence.setCompletedAt(Instant.now());

    // Calculate XP
    int totalXp = occurrence.getQuestTemplate().getBaseXpReward(); // Simplified for now, logic was in Quest entity
    // Re-implement XP calculation logic
    double multiplier = occurrence.getQuestTemplate().getDifficulty().getMultiplier();
    totalXp = (int) Math.round(totalXp * multiplier);

    occurrence.setXpEarned(totalXp);
    questOccurrenceRepository.save(occurrence);

    progressionService.awardXp(
        occurrence.getQuestTemplate().getUser().getId(), totalXp, "Quest: " + occurrence.getQuestTemplate().getTitle());

    handleRecurrence(occurrence);

    return toResponse(occurrence);
  }

  private void handleRecurrence(QuestOccurrence completedOccurrence) {
    var template = completedOccurrence.getQuestTemplate();
    if (template.getRecurrenceRule() == null || !template.isActive()) {
      return;
    }

    LocalDate nextDate = null;
    LocalDate currentDate = completedOccurrence.getScheduledDate();

    switch (template.getRecurrenceRule().getType()) {
      case DAILY -> nextDate = currentDate.plusDays(template.getRecurrenceRule().getInterval());
      case WEEKLY -> nextDate = currentDate.plusWeeks(template.getRecurrenceRule().getInterval());
      case MONTHLY -> nextDate = currentDate.plusMonths(template.getRecurrenceRule().getInterval());
      case NONE -> {
      } // Should not happen given the check above
      default -> {
      }
    }

    if (nextDate != null) {
      var nextOccurrence = QuestOccurrence.builder()
          .questTemplate(template)
          .scheduledDate(nextDate)
          .status(QuestStatus.PENDING)
          .build();
      questOccurrenceRepository.save(nextOccurrence);
    }
  }

  @Transactional
  public QuestResponse cancel(UUID id) {
    // Try occurrence
    var occurrenceOpt = questOccurrenceRepository.findById(id);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();
      if (occurrence.getStatus() != QuestStatus.PENDING)
        throw new IllegalStateException("Quest is already completed or cancelled");
      occurrence.setStatus(QuestStatus.CANCELLED);
      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

    // Try template (maybe deactivate it?)
    var template = findTemplateOrThrow(id);
    template.setActive(false);
    questTemplateRepository.save(template);
    return toResponse(template);
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findByUser(UUID userId) {
    var user = findUserOrThrow(userId);

    List<QuestResponse> responses = new ArrayList<>();

    // Get all occurrences (history + upcoming)
    // Ideally we should filter this, but for now return all
    // We can't easily query "all occurrences for user" without a custom query in
    // repo
    // I added findByUserIdAndScheduledDate but not generic findByUserId.
    // Let's use the template to find occurrences.

    var templates = questTemplateRepository.findByUserOrderByCreatedAtDesc(user);

    for (var template : templates) {
      var occurrences = questOccurrenceRepository.findByQuestTemplate(template);
      if (occurrences.isEmpty()) {
        // It's an inbox item (or just no occurrences yet)
        responses.add(toResponse(template));
      } else {
        // Add all occurrences
        for (var occurrence : occurrences) {
          responses.add(toResponse(occurrence));
        }
      }
    }

    // Sort by date/created at?
    // For now, just return the list.
    return responses;
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findByUserAndStatus(UUID userId, QuestStatus status) {
    // This is tricky because templates don't have status (except active).
    // Occurrences have status.
    // So we return occurrences with that status.

    var occurrences = questOccurrenceRepository.findByUserIdAndStatus(userId, status);
    return occurrences.stream().map(this::toResponse).toList();
  }

  @Transactional(readOnly = true)
  public QuestResponse findById(UUID id) {
    var occurrenceOpt = questOccurrenceRepository.findById(id);
    if (occurrenceOpt.isPresent()) {
      return toResponse(occurrenceOpt.get());
    }
    return toResponse(findTemplateOrThrow(id));
  }

  @Transactional
  public void delete(UUID id) {
    if (questOccurrenceRepository.existsById(id)) {
      questOccurrenceRepository.deleteById(id);
    } else {
      questTemplateRepository.deleteById(id);
    }
  }

  private User findUserOrThrow(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
  }

  private QuestTemplate findTemplateOrThrow(UUID id) {
    return questTemplateRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Quest not found: " + id));
  }

  private QuestOccurrence findOccurrenceOrThrow(UUID id) {
    return questOccurrenceRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Quest occurrence not found: " + id));
  }

  private QuestResponse toResponse(QuestTemplate template) {
    return toResponse(template, null);
  }

  private QuestResponse toResponse(QuestOccurrence occurrence) {
    return toResponse(occurrence.getQuestTemplate(), occurrence);
  }

  private QuestResponse toResponse(QuestTemplate template, QuestOccurrence occurrence) {
    var categoryResponse = template.getCategory() != null
        ? new CategoryResponse(
            template.getCategory().getId(),
            template.getCategory().getName(),
            template.getCategory().getIcon(),
            template.getCategory().getColor(),
            template.getCategory().isGlobal())
        : null;

    Instant dueDate = null;
    QuestStatus status = QuestStatus.PENDING; // Default for template
    Instant completedAt = null;
    UUID id = template.getId();

    if (occurrence != null) {
      id = occurrence.getId();
      dueDate = occurrence.getScheduledDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
      status = occurrence.getStatus();
      completedAt = occurrence.getCompletedAt();
    }

    int totalXp = (int) Math.round(template.getBaseXpReward() * template.getDifficulty().getMultiplier());

    RecurrenceType recurrenceType = RecurrenceType.NONE;
    if (template.getRecurrenceRule() != null) {
      recurrenceType = template.getRecurrenceRule().getType();
    }

    return new QuestResponse(
        id,
        template.getTitle(),
        template.getDescription(),
        template.getDifficulty(),
        template.getBaseXpReward(),
        totalXp,
        status,
        categoryResponse,
        dueDate,
        completedAt,
        template.getCreatedAt(),
        template.getUpdatedAt(),
        recurrenceType);
  }
}
