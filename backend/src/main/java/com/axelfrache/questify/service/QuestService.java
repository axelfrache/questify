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
  private final com.axelfrache.questify.repository.QuestHistoryRepository questHistoryRepository;

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
      var daysOfWeek =
          request.recurrenceDays() != null
              ? request.recurrenceDays().stream().map(d -> java.time.DayOfWeek.of(d)).toList()
              : null;
      recurrenceRule =
          RecurrenceRule.builder()
              .type(request.recurrenceInterval())
              .interval(1)
              .daysOfWeek(daysOfWeek)
              .build();
    }

    QuestTemplate parent = null;
    if (request.parentId() != null) {
      parent = findTemplateOrThrow(request.parentId());
      if (parent.getParent() != null) {
        throw new IllegalArgumentException("Subquests cannot have children (max depth = 1)");
      }

      if (parent.getRecurrenceRule() != null && recurrenceRule != null) {
        throw new IllegalArgumentException(
            "Subquests of a recurring quest cannot have their own recurrence (Checklist Mode)");
      }
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
            .parent(parent)
            .active(true)
            .build();

    questTemplateRepository.save(template);

    if (recurrenceRule == null) {
      if (request.dueDate() != null) {
        LocalDate scheduledDate = request.dueDate().atZone(user.getZoneId()).toLocalDate();
        var occurrence =
            QuestOccurrence.builder()
                .questTemplate(template)
                .scheduledDate(scheduledDate)
                .status(QuestStatus.PENDING)
                .hasDueDate(true)
                .build();

        questOccurrenceRepository.save(occurrence);
        return toResponse(occurrence);
      } else {
        return toResponse(template);
      }
    } else {
      ensureDailyOccurrences(userId);
      return toResponse(template);
    }
  }

  @Transactional
  public QuestResponse update(UUID id, UUID userId, UpdateQuestRequest request) {
    var occurrenceOpt = questOccurrenceRepository.findByIdAndUserId(id, userId);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();

      if (request.dueDate() != null) {
        if (occurrence.getStatus() != QuestStatus.PENDING) {
          throw new IllegalStateException(
              "Cannot update the due date of a completed or cancelled quest occurrence");
        }
        var userZone = occurrence.getQuestTemplate().getUser().getZoneId();
        occurrence.setScheduledDate(request.dueDate().atZone(userZone).toLocalDate());
      }

      var template = occurrence.getQuestTemplate();
      updateTemplateFields(template, request);
      questTemplateRepository.save(template);

      if (request.recurrenceDays() != null && template.getRecurrenceRule() != null) {
        var selectedDays = template.getRecurrenceRule().getDaysOfWeek();
        if (selectedDays != null && !selectedDays.isEmpty()) {
          var allOccurrences = questOccurrenceRepository.findByQuestTemplate(template);
          var occurrencesToDelete =
              allOccurrences.stream()
                  .filter(o -> o.getStatus() == QuestStatus.PENDING)
                  .filter(o -> !selectedDays.contains(o.getScheduledDate().getDayOfWeek()))
                  .toList();

          boolean currentOccurrenceDeleted =
              occurrencesToDelete.stream().anyMatch(o -> o.getId().equals(occurrence.getId()));

          questOccurrenceRepository.deleteAll(occurrencesToDelete);

          if (currentOccurrenceDeleted) {
            return toResponse(template);
          }
        }
      }

      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

    var template = findTemplateByIdAndUserOrThrow(id, userId);
    updateTemplateFields(template, request);
    questTemplateRepository.save(template);

    if (request.dueDate() != null && template.getRecurrenceRule() == null) {
      var userZone = template.getUser().getZoneId();
      var scheduledDate = request.dueDate().atZone(userZone).toLocalDate();

      var existingOccurrence =
          questOccurrenceRepository.findByQuestTemplateAndScheduledDate(template, scheduledDate);
      if (existingOccurrence.isPresent()) {
        return toResponse(existingOccurrence.get());
      }

      var occurrence =
          QuestOccurrence.builder()
              .questTemplate(template)
              .scheduledDate(scheduledDate)
              .status(QuestStatus.PENDING)
              .hasDueDate(true)
              .build();
      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

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
    if (request.categoryId() != null) {
      var category = categoryRepository.findById(request.categoryId()).orElse(null);
      template.setCategory(category);
    }

    if (request.recurrenceInterval() != null) {
      if (request.recurrenceInterval() == RecurrenceType.NONE) {
        template.setRecurrenceRule(null);
      } else {
        if (template.getParent() != null && template.getParent().getRecurrenceRule() != null) {
          throw new IllegalArgumentException(
              "Cannot add recurrence to a subquest of a recurring parent (Checklist Mode)");
        }

        if (template.getSubquests() != null && !template.getSubquests().isEmpty()) {
          boolean hasRecurringSubquests =
              template.getSubquests().stream()
                  .anyMatch(sq -> sq.getRecurrenceRule() != null && !sq.isDeleted());
          if (hasRecurringSubquests) {
            throw new IllegalArgumentException(
                "Cannot set recurrence on a parent with recurring subquests. Remove subquest recurrence first.");
          }
        }

        RecurrenceRule rule = template.getRecurrenceRule();
        if (rule == null) {
          rule = RecurrenceRule.builder().interval(1).build();
        }
        rule.setType(request.recurrenceInterval());

        if (request.recurrenceDays() != null) {
          var daysOfWeek =
              request.recurrenceDays().stream().map(d -> java.time.DayOfWeek.of(d)).toList();
          rule.setDaysOfWeek(daysOfWeek);
        }

        template.setRecurrenceRule(rule);
      }
    } else if (request.recurrenceDays() != null && template.getRecurrenceRule() != null) {
      var daysOfWeek =
          request.recurrenceDays().stream().map(d -> java.time.DayOfWeek.of(d)).toList();
      template.getRecurrenceRule().setDaysOfWeek(daysOfWeek);
    }
  }

  @Transactional
  public QuestResponse complete(UUID id, UUID userId) {
    var occurrence = questOccurrenceRepository.findByIdAndUserId(id, userId).orElse(null);

    if (occurrence == null) {
      var template = findTemplateByIdAndUserOrThrow(id, userId);

      occurrence = new QuestOccurrence();
      occurrence.setQuestTemplate(template);
      occurrence.setScheduledDate(LocalDate.now(template.getUser().getZoneId()));
      occurrence.setStatus(QuestStatus.PENDING);
      occurrence.setHasDueDate(false);
      occurrence = questOccurrenceRepository.save(occurrence);
    }

    if (occurrence.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed or cancelled");

    LocalDate today = LocalDate.now(occurrence.getQuestTemplate().getUser().getZoneId());
    boolean isRecurring = occurrence.getQuestTemplate().getRecurrenceRule() != null;
    if (isRecurring && occurrence.getScheduledDate().isAfter(today)) {
      throw new IllegalStateException("Cannot complete a future recurring quest occurrence");
    }

    occurrence.setStatus(QuestStatus.COMPLETED);
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

    saveToHistory(occurrence, totalXp);

    return toResponse(occurrence);
  }

  private void saveToHistory(QuestOccurrence occurrence, int xpEarned) {
    var template = occurrence.getQuestTemplate();
    var history =
        QuestHistory.builder()
            .userId(template.getUser().getId())
            .originalQuestId(template.getId())
            .title(template.getTitle())
            .description(template.getDescription())
            .difficulty(template.getDifficulty())
            .xpEarned(xpEarned)
            .completedAt(occurrence.getCompletedAt())
            .categoryName(template.getCategory() != null ? template.getCategory().getName() : null)
            .categoryIcon(template.getCategory() != null ? template.getCategory().getIcon() : null)
            .categoryColor(
                template.getCategory() != null ? template.getCategory().getColor() : null)
            .recurrenceType(
                template.getRecurrenceRule() != null
                    ? template.getRecurrenceRule().getType()
                    : RecurrenceType.NONE)
            .parentTitle(template.getParent() != null ? template.getParent().getTitle() : null)
            .build();
    questHistoryRepository.save(history);
  }

  @Transactional
  public QuestResponse cancel(UUID id, UUID userId) {
    var occurrenceOpt = questOccurrenceRepository.findByIdAndUserId(id, userId);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();
      if (occurrence.getStatus() != QuestStatus.PENDING)
        throw new IllegalStateException("Quest is already completed or cancelled");
      occurrence.setStatus(QuestStatus.CANCELLED);
      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

    var template = findTemplateByIdAndUserOrThrow(id, userId);
    template.setActive(false);
    questTemplateRepository.save(template);
    return toResponse(template);
  }

  @Transactional
  public void ensureDailyOccurrences(UUID userId) {
    ensureDailyOccurrences(findUserOrThrow(userId));
  }

  @Transactional
  public void ensureDailyOccurrences(User user) {
    var templates = questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(user);
    LocalDate today = LocalDate.now(user.getZoneId());

    for (var template : templates) {
      if (template.getRecurrenceRule() == null) continue;

      autoSkipPastPendingOccurrences(template, today);

      if (shouldGenerateOccurrence(template, today)) {
        if (!questOccurrenceRepository.existsByQuestTemplateAndScheduledDate(template, today)) {
          var occurrence =
              QuestOccurrence.builder()
                  .questTemplate(template)
                  .scheduledDate(today)
                  .status(QuestStatus.PENDING)
                  .build();
          questOccurrenceRepository.save(occurrence);

          if (template.getSubquests() != null) {
            for (var subquest : template.getSubquests()) {
              if (subquest.isActive() && !subquest.isDeleted()) {
                autoSkipPastPendingOccurrences(subquest, today);

                if (!questOccurrenceRepository.existsByQuestTemplateAndScheduledDate(
                    subquest, today)) {
                  var subOccurrence =
                      QuestOccurrence.builder()
                          .questTemplate(subquest)
                          .scheduledDate(today)
                          .status(QuestStatus.PENDING)
                          .build();
                  questOccurrenceRepository.save(subOccurrence);
                }
              }
            }
          }
        }
      }
    }
  }

  private void autoSkipPastPendingOccurrences(QuestTemplate template, LocalDate today) {
    var pastPendingOccurrences =
        questOccurrenceRepository.findByQuestTemplate(template).stream()
            .filter(o -> o.getStatus() == QuestStatus.PENDING)
            .filter(o -> o.getScheduledDate().isBefore(today))
            .toList();

    for (var occurrence : pastPendingOccurrences) {
      occurrence.setStatus(QuestStatus.SKIPPED);
      questOccurrenceRepository.save(occurrence);
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
              == template.getCreatedAt().atZone(template.getUser().getZoneId()).getDayOfMonth();
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
    var user = findUserOrThrow(userId);
    ensureDailyOccurrences(user);

    var allOccurrences = questOccurrenceRepository.findAllByUserIdWithSubquests(userId);
    LocalDate today = LocalDate.now(user.getZoneId());

    return allOccurrences.stream()
        .filter(q -> q.getStatus() != QuestStatus.SKIPPED)
        .filter(q -> q.getScheduledDate().equals(today))
        .filter(
            q ->
                !(q.getQuestTemplate().getSubquests() != null
                    && !q.getQuestTemplate().getSubquests().isEmpty()
                    && q.getQuestTemplate().getRecurrenceRule() == null))
        .sorted((o1, o2) -> o1.getScheduledDate().compareTo(o2.getScheduledDate()))
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public List<QuestResponse> findInboxQuests(UUID userId) {
    var user = findUserOrThrow(userId);
    ensureDailyOccurrences(user);

    var allOccurrences = questOccurrenceRepository.findAllByUserIdWithSubquests(userId);
    var occurrenceResponses =
        allOccurrences.stream()
            .filter(q -> q.getStatus() == QuestStatus.PENDING)
            .filter(q -> q.getQuestTemplate().getParent() == null)
            .sorted((o1, o2) -> o2.getScheduledDate().compareTo(o1.getScheduledDate()))
            .map(this::toResponse)
            .collect(Collectors.toList());

    var templatesWithOccurrences =
        allOccurrences.stream().map(o -> o.getQuestTemplate().getId()).collect(Collectors.toSet());

    var floatingTemplates =
        questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(user).stream()
            .filter(t -> t.getRecurrenceRule() == null)
            .filter(t -> !templatesWithOccurrences.contains(t.getId()))
            .filter(t -> t.getParent() == null)
            .map(this::toResponse)
            .toList();

    var result = new java.util.ArrayList<QuestResponse>();
    result.addAll(floatingTemplates);
    result.addAll(occurrenceResponses);
    return result;
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findUpcomingQuests(UUID userId) {
    var user = findUserOrThrow(userId);
    var templates = questTemplateRepository.findByUserAndActiveTrueAndDeletedFalse(user);
    LocalDate today = LocalDate.now(user.getZoneId());
    LocalDate endDate = today.plusDays(7);

    final int maxResults = 100;
    List<QuestResponse> upcomingQuests = new java.util.ArrayList<>();

    for (LocalDate date = today.plusDays(1);
        date.isBefore(endDate.plusDays(1)) && upcomingQuests.size() < maxResults;
        date = date.plusDays(1)) {
      for (var template : templates) {
        if (upcomingQuests.size() >= maxResults) break;
        if (template.getRecurrenceRule() == null) continue;

        if (shouldGenerateOccurrence(template, date)) {
          var existingOccurrence =
              questOccurrenceRepository.findByQuestTemplateAndScheduledDate(template, date);
          if (existingOccurrence.isPresent()) {
            upcomingQuests.add(toResponse(existingOccurrence.get()));
          } else {
            upcomingQuests.add(toGhostResponse(template, date));
          }
        }
      }
    }

    return upcomingQuests;
  }

  @Transactional
  public QuestResponse skip(UUID id, UUID userId) {
    var occurrence = findOccurrenceByIdAndUserOrThrow(id, userId);

    if (occurrence.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed, cancelled or skipped");

    LocalDate today = LocalDate.now(occurrence.getQuestTemplate().getUser().getZoneId());
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
  public QuestResponse findById(UUID id, UUID userId) {
    var occurrenceOpt = questOccurrenceRepository.findByIdAndUserId(id, userId);
    if (occurrenceOpt.isPresent()) {
      return toResponse(occurrenceOpt.get());
    }
    return toResponse(findTemplateByIdAndUserOrThrow(id, userId));
  }

  @Transactional
  public void delete(UUID id, UUID userId) {
    var occurrenceOpt = questOccurrenceRepository.findByIdAndUserId(id, userId);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();
      var template = occurrence.getQuestTemplate();

      questOccurrenceRepository.delete(occurrence);

      if (template.getRecurrenceRule() == null) {
        deleteTemplate(template);
      }
    } else {
      var template = findTemplateByIdAndUserOrThrow(id, userId);
      deleteTemplate(template);
    }
  }

  private void deleteTemplate(QuestTemplate template) {
    if (template.getSubquests() != null) {
      for (var subquest : template.getSubquests()) {
        if (!subquest.isDeleted()) {
          deleteTemplate(subquest);
        }
      }
    }

    if (template.getOccurrences() != null && !template.getOccurrences().isEmpty()) {
      var occurrences = new java.util.ArrayList<>(template.getOccurrences());
      template.getOccurrences().clear();
      questOccurrenceRepository.deleteAll(occurrences);
    }

    template.setDeleted(true);
    template.setActive(false);
    questTemplateRepository.save(template);
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

  private QuestOccurrence findOccurrenceByIdAndUserOrThrow(UUID id, UUID userId) {
    return questOccurrenceRepository
        .findByIdAndUserId(id, userId)
        .orElseThrow(() -> new IllegalArgumentException("Quest occurrence not found: " + id));
  }

  private QuestTemplate findTemplateByIdAndUserOrThrow(UUID id, UUID userId) {
    return questTemplateRepository
        .findByIdAndUserId(id, userId)
        .orElseThrow(() -> new IllegalArgumentException("Quest not found: " + id));
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
  public QuestResponse toggleActive(UUID id, UUID userId) {
    var template = findTemplateByIdAndUserOrThrow(id, userId);
    template.setActive(!template.isActive());
    questTemplateRepository.save(template);
    return toResponse(template);
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findSubquests(UUID parentId, UUID userId) {
    var parent = findTemplateByIdAndUserOrThrow(parentId, userId);
    return parent.getSubquests().stream()
        .filter(sq -> !sq.isDeleted() && sq.isActive())
        .map(
            sq -> {
              var latestOccurrence =
                  sq.getOccurrences() != null && !sq.getOccurrences().isEmpty()
                      ? sq.getOccurrences().stream()
                          .max((a, b) -> a.getScheduledDate().compareTo(b.getScheduledDate()))
                          .orElse(null)
                      : null;
              if (latestOccurrence != null) {
                return toResponse(latestOccurrence);
              }
              return toResponse(sq);
            })
        .toList();
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
      dueDate =
          occurrence.getScheduledDate().atStartOfDay(template.getUser().getZoneId()).toInstant();
      status = occurrence.getStatus();
      completedAt = occurrence.getCompletedAt();
    }

    int totalXp =
        (int) Math.round(template.getBaseXpReward() * template.getDifficulty().getMultiplier());

    List<Integer> recurrenceDays = null;
    RecurrenceType recurrenceType = RecurrenceType.NONE;
    if (template.getRecurrenceRule() != null) {
      recurrenceType = template.getRecurrenceRule().getType();
      if (template.getRecurrenceRule().getDaysOfWeek() != null) {
        recurrenceDays =
            template.getRecurrenceRule().getDaysOfWeek().stream().map(d -> d.getValue()).toList();
      }
    }

    UUID parentId = template.getParent() != null ? template.getParent().getId() : null;
    String parentTitle = template.getParent() != null ? template.getParent().getTitle() : null;

    int subquestCount = 0;
    int completedSubquestCount = 0;
    if (template.getSubquests() != null && !template.getSubquests().isEmpty()) {
      var activeSubquests =
          template.getSubquests().stream().filter(sq -> !sq.isDeleted() && sq.isActive()).toList();
      subquestCount = activeSubquests.size();
      completedSubquestCount =
          (int)
              activeSubquests.stream()
                  .filter(
                      sq -> {
                        var latestOccurrence =
                            sq.getOccurrences() != null && !sq.getOccurrences().isEmpty()
                                ? sq.getOccurrences().stream()
                                    .max(
                                        (a, b) ->
                                            a.getScheduledDate().compareTo(b.getScheduledDate()))
                                    .orElse(null)
                                : null;
                        return latestOccurrence != null
                            && latestOccurrence.getStatus() == QuestStatus.COMPLETED;
                      })
                  .count();
    }

    return new QuestResponse(
        id,
        template.getId(),
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
        recurrenceType,
        recurrenceDays,
        parentId,
        parentTitle,
        subquestCount,
        completedSubquestCount);
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

    Instant dueDate = scheduledDate.atStartOfDay(template.getUser().getZoneId()).toInstant();
    int totalXp =
        (int) Math.round(template.getBaseXpReward() * template.getDifficulty().getMultiplier());

    List<Integer> recurrenceDays = null;
    RecurrenceType recurrenceType = RecurrenceType.NONE;
    if (template.getRecurrenceRule() != null) {
      recurrenceType = template.getRecurrenceRule().getType();
      if (template.getRecurrenceRule().getDaysOfWeek() != null) {
        recurrenceDays =
            template.getRecurrenceRule().getDaysOfWeek().stream().map(d -> d.getValue()).toList();
      }
    }

    UUID parentId = template.getParent() != null ? template.getParent().getId() : null;
    String parentTitle = template.getParent() != null ? template.getParent().getTitle() : null;

    return new QuestResponse(
        template.getId(),
        template.getId(),
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
        recurrenceType,
        recurrenceDays,
        parentId,
        parentTitle,
        0,
        0);
  }
}
