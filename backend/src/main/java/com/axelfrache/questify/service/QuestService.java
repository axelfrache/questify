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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
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

    var category =
        request.categoryId() != null
            ? categoryRepository.findById(request.categoryId()).orElse(null)
            : null;

    RecurrenceRule recurrenceRule = null;
    if (request.recurrenceInterval() != null
        && request.recurrenceInterval() != RecurrenceType.NONE) {
      recurrenceRule =
          RecurrenceRule.builder().type(request.recurrenceInterval()).interval(1).build();
    }

    var template =
        QuestTemplate.builder()
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

    if (recurrenceRule == null) {
      LocalDate scheduledDate =
          request.dueDate() != null
              ? request.dueDate().atZone(ZoneId.systemDefault()).toLocalDate()
              : LocalDate.now();

      var occurrence =
          QuestOccurrence.builder()
              .questTemplate(template)
              .scheduledDate(scheduledDate)
              .status(QuestStatus.PENDING)
              .build();

      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    } else {
      ensureDailyOccurrences(userId);
      return toResponse(template);
    }
  }

  @Transactional
  public QuestResponse update(UUID id, UpdateQuestRequest request) {
    var occurrenceOpt = questOccurrenceRepository.findById(id);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();

      if (request.dueDate() != null) {
        if (occurrence.getStatus() != QuestStatus.PENDING) {
          throw new IllegalStateException(
              "Cannot update the due date of a completed or cancelled quest occurrence");
        }
        occurrence.setScheduledDate(request.dueDate().atZone(ZoneId.systemDefault()).toLocalDate());
      }

      var template = occurrence.getQuestTemplate();
      updateTemplateFields(template, request);
      questTemplateRepository.save(template);

      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

    var template = findTemplateOrThrow(id);
    updateTemplateFields(template, request);

    questTemplateRepository.save(template);
    return toResponse(template);
  }

  private void updateTemplateFields(QuestTemplate template, UpdateQuestRequest request) {
    if (request.title() != null) {
      template.setTitle(request.title());
    }
    if (request.description() != null) {
      template.setDescription(request.description());
    }
    if (request.difficulty() != null) {
      template.setDifficulty(request.difficulty());
    }
    if (request.baseXpReward() != null) {
      template.setBaseXpReward(request.baseXpReward());
    }

    if (request.recurrenceInterval() != null) {
      if (request.recurrenceInterval() == RecurrenceType.NONE) {
        template.setRecurrenceRule(null);
      } else {
        RecurrenceRule rule = template.getRecurrenceRule();
        if (rule == null) {
          rule = RecurrenceRule.builder().interval(1).build();
        }
        rule.setType(request.recurrenceInterval());
        template.setRecurrenceRule(rule);
      }
    }
  }

  @Transactional
  public QuestResponse complete(UUID id) {
    var occurrence = findOccurrenceOrThrow(id);

    if (occurrence.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed or cancelled");

    LocalDate today = LocalDate.now();
    if (occurrence.getScheduledDate().isAfter(today)) {
      throw new IllegalStateException("Cannot complete a future quest occurrence");
    }

    occurrence.setStatus(QuestStatus.COMPLETED);
    occurrence.setCompletedAt(Instant.now());

    occurrence.setCompletedAt(Instant.now());

    int totalXp = occurrence.getQuestTemplate().getBaseXpReward();
    double multiplier = occurrence.getQuestTemplate().getDifficulty().getMultiplier();
    totalXp = (int) Math.round(totalXp * multiplier);

    occurrence.setXpEarned(totalXp);
    questOccurrenceRepository.save(occurrence);

    progressionService.awardXp(
        occurrence.getQuestTemplate().getUser().getId(),
        totalXp,
        "Quest: " + occurrence.getQuestTemplate().getTitle());

    return toResponse(occurrence);
  }

  @Transactional
  public QuestResponse cancel(UUID id) {
    var occurrenceOpt = questOccurrenceRepository.findById(id);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();
      if (occurrence.getStatus() != QuestStatus.PENDING)
        throw new IllegalStateException("Quest is already completed or cancelled");
      occurrence.setStatus(QuestStatus.CANCELLED);
      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

    var template = findTemplateOrThrow(id);
    template.setActive(false);
    questTemplateRepository.save(template);
    return toResponse(template);
  }

  @Transactional
  public void ensureDailyOccurrences(UUID userId) {
    var user = findUserOrThrow(userId);
    var templates = questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(user);
    LocalDate today = LocalDate.now();

    for (var template : templates) {
      if (template.getRecurrenceRule() == null) continue;

      if (shouldGenerateOccurrence(template, today)) {
        if (!questOccurrenceRepository.existsByQuestTemplateAndScheduledDate(template, today)) {
          var occurrence =
              QuestOccurrence.builder()
                  .questTemplate(template)
                  .scheduledDate(today)
                  .status(QuestStatus.PENDING)
                  .build();
          questOccurrenceRepository.save(occurrence);
        }
      }
    }
  }

  private boolean shouldGenerateOccurrence(QuestTemplate template, LocalDate date) {
    RecurrenceRule rule = template.getRecurrenceRule();
    if (rule == null) return false;

    return switch (rule.getType()) {
      case DAILY -> true;
      case WEEKLY -> {
        if (rule.getDaysOfWeek() == null || rule.getDaysOfWeek().isEmpty()) yield true;
        yield rule.getDaysOfWeek().contains(date.getDayOfWeek());
      }
      case MONTHLY ->
          date.getDayOfMonth()
              == template.getCreatedAt().atZone(ZoneId.systemDefault()).getDayOfMonth();
      case CUSTOM -> true;
      case NONE -> false;
    };
  }

  @Transactional
  public List<QuestResponse> findByUser(UUID userId) {
    var user = findUserOrThrow(userId);
    return questTemplateRepository.findByUserAndDeletedFalseOrderByCreatedAtDesc(user).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public List<QuestResponse> findTodayQuests(UUID userId) {
    ensureDailyOccurrences(userId);

    var allOccurrences = questOccurrenceRepository.findAllByUserId(userId);
    LocalDate today = LocalDate.now();

    return allOccurrences.stream()
        .filter(
            q -> {
              boolean isToday = q.getScheduledDate().equals(today);
              boolean isOverdue =
                  q.getScheduledDate().isBefore(today) && q.getStatus() == QuestStatus.PENDING;
              return isToday || isOverdue;
            })
        .sorted((o1, o2) -> o1.getScheduledDate().compareTo(o2.getScheduledDate()))
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public List<QuestResponse> findInboxQuests(UUID userId) {
    ensureDailyOccurrences(userId);
    var allOccurrences = questOccurrenceRepository.findAllByUserId(userId);
    return allOccurrences.stream()
        .filter(q -> q.getStatus() == QuestStatus.PENDING)
        .sorted((o1, o2) -> o2.getScheduledDate().compareTo(o1.getScheduledDate()))
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findUpcomingQuests(UUID userId) {
    var user = findUserOrThrow(userId);
    var templates = questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(user);
    LocalDate today = LocalDate.now();
    LocalDate endDate = today.plusDays(7);

    List<QuestResponse> upcomingQuests = new java.util.ArrayList<>();

    for (LocalDate date = today.plusDays(1);
        date.isBefore(endDate.plusDays(1));
        date = date.plusDays(1)) {
      for (var template : templates) {
        if (template.getRecurrenceRule() == null) continue;

        if (shouldGenerateOccurrence(template, date)) {
          // Check if real occurrence exists
          var existingOccurrence =
              questOccurrenceRepository.findByQuestTemplateAndScheduledDate(template, date);
          if (existingOccurrence.isPresent()) {
            upcomingQuests.add(toResponse(existingOccurrence.get()));
          } else {
            // Create ghost response
            upcomingQuests.add(toGhostResponse(template, date));
          }
        }
      }
    }

    return upcomingQuests;
  }

  @Transactional
  public QuestResponse skip(UUID id) {
    var occurrence = findOccurrenceOrThrow(id);

    if (occurrence.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed, cancelled or skipped");

    LocalDate today = LocalDate.now();
    if (occurrence.getScheduledDate().isAfter(today)) {
      throw new IllegalStateException("Cannot skip a future quest occurrence");
    }

    occurrence.setStatus(QuestStatus.SKIPPED);
    questOccurrenceRepository.save(occurrence);

    return toResponse(occurrence);
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findByUserAndStatus(UUID userId, QuestStatus status) {
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
      var template = findTemplateOrThrow(id);
      template.setDeleted(true);
      template.setActive(false);
      questTemplateRepository.save(template);

      var pendingOccurrences =
          template.getOccurrences().stream()
              .filter(o -> o.getStatus() == QuestStatus.PENDING)
              .toList();
      questOccurrenceRepository.deleteAll(pendingOccurrences);
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

  @Transactional(readOnly = true)
  public List<QuestResponse> findRecurringTemplates(UUID userId) {
    var user = findUserOrThrow(userId);
    return questTemplateRepository
        .findByUserAndRecurrenceRuleIsNotNullAndDeletedFalse(user)
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public QuestResponse toggleActive(UUID id) {
    var template = findTemplateOrThrow(id);
    template.setActive(!template.isActive());
    questTemplateRepository.save(template);
    return toResponse(template);
  }

  private QuestResponse toResponse(QuestTemplate template) {
    return toResponse(template, null);
  }

  private QuestResponse toResponse(QuestOccurrence occurrence) {
    return toResponse(occurrence.getQuestTemplate(), occurrence);
  }

  private QuestResponse toResponse(QuestTemplate template, QuestOccurrence occurrence) {
    var categoryResponse =
        template.getCategory() != null
            ? new CategoryResponse(
                template.getCategory().getId(),
                template.getCategory().getName(),
                template.getCategory().getIcon(),
                template.getCategory().getColor(),
                template.getCategory().isGlobal())
            : null;

    Instant dueDate = null;
    QuestStatus status = QuestStatus.PENDING;
    Instant completedAt = null;
    UUID id = template.getId();

    if (occurrence != null) {
      id = occurrence.getId();
      dueDate = occurrence.getScheduledDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
      status = occurrence.getStatus();
      completedAt = occurrence.getCompletedAt();
    }

    int totalXp =
        (int) Math.round(template.getBaseXpReward() * template.getDifficulty().getMultiplier());

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

  private QuestResponse toGhostResponse(QuestTemplate template, LocalDate scheduledDate) {
    var categoryResponse =
        template.getCategory() != null
            ? new CategoryResponse(
                template.getCategory().getId(),
                template.getCategory().getName(),
                template.getCategory().getIcon(),
                template.getCategory().getColor(),
                template.getCategory().isGlobal())
            : null;

    Instant dueDate = scheduledDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
    int totalXp =
        (int) Math.round(template.getBaseXpReward() * template.getDifficulty().getMultiplier());

    RecurrenceType recurrenceType = RecurrenceType.NONE;
    if (template.getRecurrenceRule() != null) {
      recurrenceType = template.getRecurrenceRule().getType();
    }

    return new QuestResponse(
        template.getId(), // Using template ID for ghost
        template.getTitle(),
        template.getDescription(),
        template.getDifficulty(),
        template.getBaseXpReward(),
        totalXp,
        QuestStatus.PENDING,
        categoryResponse,
        dueDate,
        null,
        template.getCreatedAt(),
        template.getUpdatedAt(),
        recurrenceType);
  }
}
