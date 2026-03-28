package com.axelfrache.questify.quest.service;

import com.axelfrache.questify.quest.dto.CategoryResponse;
import com.axelfrache.questify.quest.dto.CreateQuestRequest;
import com.axelfrache.questify.quest.dto.QuestResponse;
import com.axelfrache.questify.quest.dto.UpdateQuestRequest;
import com.axelfrache.questify.quest.messaging.QuestEventPublisher;
import com.axelfrache.questify.quest.model.Category;
import com.axelfrache.questify.quest.model.Difficulty;
import com.axelfrache.questify.quest.model.QuestHistory;
import com.axelfrache.questify.quest.model.QuestOccurrence;
import com.axelfrache.questify.quest.model.QuestStatus;
import com.axelfrache.questify.quest.model.QuestTemplate;
import com.axelfrache.questify.quest.model.RecurrenceRule;
import com.axelfrache.questify.quest.model.RecurrenceType;
import com.axelfrache.questify.quest.repository.CategoryRepository;
import com.axelfrache.questify.quest.repository.QuestHistoryRepository;
import com.axelfrache.questify.quest.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.quest.repository.QuestTemplateRepository;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestService {

  private final QuestTemplateRepository questTemplateRepository;
  private final QuestOccurrenceRepository questOccurrenceRepository;
  private final CategoryRepository categoryRepository;
  private final QuestHistoryRepository questHistoryRepository;
  private final QuestEventPublisher questEventPublisher;

  @Transactional
  public QuestResponse create(UUID userId, CreateQuestRequest request) {
    var category = request.categoryId() != null
        ? categoryRepository.findById(request.categoryId()).orElse(null)
        : null;

    RecurrenceRule recurrenceRule = null;
    if (request.recurrenceInterval() != null && request.recurrenceInterval() != RecurrenceType.NONE) {
      var daysOfWeek = request.recurrenceDays() != null
          ? request.recurrenceDays().stream().map(DayOfWeek::of).toList()
          : null;
      recurrenceRule = RecurrenceRule.builder()
          .type(request.recurrenceInterval())
          .interval(1)
          .daysOfWeek(daysOfWeek)
          .build();
    }

    QuestTemplate parent = null;
    if (request.parentId() != null) {
      parent = findTemplateOrThrow(request.parentId());
      if (parent.getParent() != null)
        throw new IllegalArgumentException("Subquests cannot have children (max depth = 1)");
      if (parent.getRecurrenceRule() != null && recurrenceRule != null)
        throw new IllegalArgumentException(
            "Subquests of a recurring quest cannot have their own recurrence (Checklist Mode)");
    }

    var template = QuestTemplate.builder()
        .title(request.title())
        .description(request.description())
        .difficulty(request.difficulty() != null ? request.difficulty() : Difficulty.MEDIUM)
        .baseXpReward(request.baseXpReward() != null ? request.baseXpReward() : 50)
        .category(category)
        .projectId(request.projectId())
        .userId(userId)
        .recurrenceRule(recurrenceRule)
        .parent(parent)
        .active(true)
        .build();

    questTemplateRepository.save(template);

    if (recurrenceRule == null) {
      if (request.dueDate() != null) {
        var scheduledDate = request.dueDate().atZone(ZoneOffset.UTC).toLocalDate();
        var occurrence = QuestOccurrence.builder()
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

    ensureDailyOccurrences(userId);
    return toResponse(template);
  }

  @Transactional
  public QuestResponse update(UUID id, UUID userId, UpdateQuestRequest request) {
    var occurrenceOpt = questOccurrenceRepository.findByIdAndUserId(id, userId);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();

      if (request.dueDate() != null) {
        if (occurrence.getStatus() != QuestStatus.PENDING)
          throw new IllegalStateException(
              "Cannot update the due date of a completed or cancelled quest occurrence");
        occurrence.setScheduledDate(request.dueDate().atZone(ZoneOffset.UTC).toLocalDate());
      }

      var template = occurrence.getQuestTemplate();
      updateTemplateFields(template, request, userId);
      questTemplateRepository.save(template);

      if (request.recurrenceDays() != null && template.getRecurrenceRule() != null) {
        var selectedDays = template.getRecurrenceRule().getDaysOfWeek();
        if (selectedDays != null && !selectedDays.isEmpty()) {
          var toDelete = questOccurrenceRepository.findByQuestTemplate(template).stream()
              .filter(o -> o.getStatus() == QuestStatus.PENDING)
              .filter(o -> !selectedDays.contains(o.getScheduledDate().getDayOfWeek()))
              .toList();
          var currentDeleted = toDelete.stream().anyMatch(o -> o.getId().equals(occurrence.getId()));
          questOccurrenceRepository.deleteAll(toDelete);
          if (currentDeleted) return toResponse(template);
        }
      }

      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

    var template = findTemplateByIdAndUserOrThrow(id, userId);
    updateTemplateFields(template, request, userId);
    questTemplateRepository.save(template);

    if (request.dueDate() != null && template.getRecurrenceRule() == null) {
      var scheduledDate = request.dueDate().atZone(ZoneOffset.UTC).toLocalDate();
      return questOccurrenceRepository.findByQuestTemplateAndScheduledDate(template, scheduledDate)
          .map(this::toResponse)
          .orElseGet(() -> {
            var occurrence = QuestOccurrence.builder()
                .questTemplate(template)
                .scheduledDate(scheduledDate)
                .status(QuestStatus.PENDING)
                .hasDueDate(true)
                .build();
            questOccurrenceRepository.save(occurrence);
            return toResponse(occurrence);
          });
    }

    return toResponse(template);
  }

  private void updateTemplateFields(QuestTemplate template, UpdateQuestRequest request, UUID userId) {
    if (request.title() != null) template.setTitle(request.title());
    if (request.description() != null) template.setDescription(request.description());
    if (request.difficulty() != null) template.setDifficulty(request.difficulty());
    if (request.baseXpReward() != null) template.setBaseXpReward(request.baseXpReward());
    if (request.categoryId() != null) {
      template.setCategory(categoryRepository.findById(request.categoryId()).orElse(null));
    }
    if (request.projectId() != null) template.setProjectId(request.projectId());

    if (request.recurrenceInterval() != null) {
      if (request.recurrenceInterval() == RecurrenceType.NONE) {
        template.setRecurrenceRule(null);
      } else {
        if (template.getParent() != null && template.getParent().getRecurrenceRule() != null)
          throw new IllegalArgumentException(
              "Cannot add recurrence to a subquest of a recurring parent (Checklist Mode)");
        if (template.getSubquests() != null
            && template.getSubquests().stream()
                .anyMatch(sq -> sq.getRecurrenceRule() != null && !sq.isDeleted()))
          throw new IllegalArgumentException(
              "Cannot set recurrence on a parent with recurring subquests");

        var rule = template.getRecurrenceRule() != null
            ? template.getRecurrenceRule()
            : RecurrenceRule.builder().interval(1).build();
        rule.setType(request.recurrenceInterval());
        if (request.recurrenceDays() != null)
          rule.setDaysOfWeek(request.recurrenceDays().stream().map(DayOfWeek::of).toList());
        template.setRecurrenceRule(rule);
      }
    } else if (request.recurrenceDays() != null && template.getRecurrenceRule() != null) {
      template.getRecurrenceRule()
          .setDaysOfWeek(request.recurrenceDays().stream().map(DayOfWeek::of).toList());
    }
  }

  @Transactional
  public QuestResponse complete(UUID id, UUID userId) {
    var occurrence = questOccurrenceRepository.findByIdAndUserId(id, userId).orElse(null);

    if (occurrence == null) {
      var template = findTemplateByIdAndUserOrThrow(id, userId);
      occurrence = QuestOccurrence.builder()
          .questTemplate(template)
          .scheduledDate(LocalDate.now(ZoneOffset.UTC))
          .status(QuestStatus.PENDING)
          .hasDueDate(false)
          .build();
      occurrence = questOccurrenceRepository.save(occurrence);
    }

    if (occurrence.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed or cancelled");

    var today = LocalDate.now(ZoneOffset.UTC);
    if (occurrence.getQuestTemplate().getRecurrenceRule() != null
        && occurrence.getScheduledDate().isAfter(today))
      throw new IllegalStateException("Cannot complete a future recurring quest occurrence");

    occurrence.setStatus(QuestStatus.COMPLETED);
    occurrence.setCompletedAt(Instant.now());

    var template = occurrence.getQuestTemplate();
    var xpEarned = (int) Math.round(template.getBaseXpReward() * template.getDifficulty().getMultiplier());
    occurrence.setXpEarned(xpEarned);
    questOccurrenceRepository.save(occurrence);

    questEventPublisher.publishQuestCompleted(userId, template.getId(), template.getTitle(), xpEarned);
    saveToHistory(occurrence, xpEarned);

    return toResponse(occurrence);
  }

  private void saveToHistory(QuestOccurrence occurrence, int xpEarned) {
    var template = occurrence.getQuestTemplate();
    var category = template.getCategory();
    var history = QuestHistory.builder()
        .userId(template.getUserId())
        .originalQuestId(template.getId())
        .title(template.getTitle())
        .description(template.getDescription())
        .difficulty(template.getDifficulty())
        .xpEarned(xpEarned)
        .completedAt(occurrence.getCompletedAt())
        .categoryName(category != null ? category.getName() : null)
        .categoryIcon(category != null ? category.getIcon() : null)
        .categoryColor(category != null ? category.getColor() : null)
        .recurrenceType(template.getRecurrenceRule() != null
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
  public QuestResponse skip(UUID id, UUID userId) {
    var occurrence = questOccurrenceRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new IllegalArgumentException("Quest occurrence not found: " + id));

    if (occurrence.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed, cancelled or skipped");

    var today = LocalDate.now(ZoneOffset.UTC);
    if (occurrence.getScheduledDate().isAfter(today))
      throw new IllegalStateException("Cannot skip a future quest occurrence");

    occurrence.setStatus(QuestStatus.SKIPPED);
    questOccurrenceRepository.save(occurrence);
    return toResponse(occurrence);
  }

  @Transactional
  public void ensureDailyOccurrences(UUID userId) {
    var templates = questTemplateRepository.findByUserIdAndActiveTrueAndDeletedFalse(userId);
    var today = LocalDate.now(ZoneOffset.UTC);

    for (var template : templates) {
      if (template.getRecurrenceRule() == null) continue;

      autoSkipPast(template, today);

      if (shouldGenerate(template, today)
          && !questOccurrenceRepository.existsByQuestTemplateAndScheduledDate(template, today)) {
        questOccurrenceRepository.save(QuestOccurrence.builder()
            .questTemplate(template)
            .scheduledDate(today)
            .status(QuestStatus.PENDING)
            .build());

        if (template.getSubquests() != null) {
          for (var sub : template.getSubquests()) {
            if (sub.isActive() && !sub.isDeleted()) {
              autoSkipPast(sub, today);
              if (!questOccurrenceRepository.existsByQuestTemplateAndScheduledDate(sub, today)) {
                questOccurrenceRepository.save(QuestOccurrence.builder()
                    .questTemplate(sub)
                    .scheduledDate(today)
                    .status(QuestStatus.PENDING)
                    .build());
              }
            }
          }
        }
      }
    }
  }

  private void autoSkipPast(QuestTemplate template, LocalDate today) {
    var toSkip = questOccurrenceRepository.findByQuestTemplate(template).stream()
        .filter(o -> o.getStatus() == QuestStatus.PENDING && o.getScheduledDate().isBefore(today))
        .peek(o -> o.setStatus(QuestStatus.SKIPPED))
        .toList();
    if (!toSkip.isEmpty()) questOccurrenceRepository.saveAll(toSkip);
  }

  private boolean shouldGenerate(QuestTemplate template, LocalDate date) {
    var rule = template.getRecurrenceRule();
    if (rule == null) return false;
    return switch (rule.getType()) {
      case DAILY -> true;
      case WEEKLY -> rule.getDaysOfWeek() == null || rule.getDaysOfWeek().isEmpty()
          || rule.getDaysOfWeek().contains(date.getDayOfWeek());
      case MONTHLY -> date.getDayOfMonth()
          == template.getCreatedAt().atZone(ZoneOffset.UTC).getDayOfMonth();
      case CUSTOM -> true;
      case NONE -> false;
    };
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findByUser(UUID userId) {
    return questTemplateRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public List<QuestResponse> findTodayQuests(UUID userId) {
    ensureDailyOccurrences(userId);
    var today = LocalDate.now(ZoneOffset.UTC);
    return questOccurrenceRepository.findAllByUserIdWithSubquests(userId).stream()
        .filter(q -> q.getStatus() != QuestStatus.SKIPPED)
        .filter(q -> q.getQuestTemplate().isActive() && !q.getQuestTemplate().isDeleted())
        .filter(q -> q.getScheduledDate().equals(today))
        .filter(q -> !(q.getQuestTemplate().getSubquests() != null
            && !q.getQuestTemplate().getSubquests().isEmpty()
            && q.getQuestTemplate().getRecurrenceRule() == null))
        .sorted(Comparator.comparing(QuestOccurrence::getScheduledDate))
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public List<QuestResponse> findInboxQuests(UUID userId) {
    ensureDailyOccurrences(userId);
    var allOccurrences = questOccurrenceRepository.findAllByUserIdWithSubquests(userId);

    var occurrenceResponses = allOccurrences.stream()
        .filter(q -> q.getStatus() == QuestStatus.PENDING)
        .filter(q -> q.getQuestTemplate().isActive() && !q.getQuestTemplate().isDeleted())
        .filter(q -> q.getQuestTemplate().getParent() == null)
        .sorted((o1, o2) -> o2.getScheduledDate().compareTo(o1.getScheduledDate()))
        .map(this::toResponse)
        .toList();

    var templateIdsWithOccurrences = allOccurrences.stream()
        .map(o -> o.getQuestTemplate().getId())
        .collect(Collectors.toSet());

    var floating = questTemplateRepository.findByUserIdAndActiveTrueAndDeletedFalse(userId).stream()
        .filter(t -> t.getRecurrenceRule() == null)
        .filter(t -> !templateIdsWithOccurrences.contains(t.getId()))
        .filter(t -> t.getParent() == null)
        .map(this::toResponse)
        .toList();

    var result = new ArrayList<QuestResponse>(floating);
    result.addAll(occurrenceResponses);
    return result;
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findUpcomingQuests(UUID userId) {
    var templates = questTemplateRepository.findByUserIdAndActiveTrueAndDeletedFalse(userId);
    var today = LocalDate.now(ZoneOffset.UTC);
    var endDate = today.plusDays(7);
    final var maxResults = 100;
    var upcoming = new ArrayList<QuestResponse>();

    for (var date = today.plusDays(1);
        !date.isAfter(endDate) && upcoming.size() < maxResults;
        date = date.plusDays(1)) {
      for (var template : templates) {
        if (upcoming.size() >= maxResults) break;
        if (template.getRecurrenceRule() == null) continue;
        if (!shouldGenerate(template, date)) continue;

        var response = questOccurrenceRepository
            .findByQuestTemplateAndScheduledDate(template, date)
            .map(this::toResponse)
            .orElseGet(() -> toGhostResponse(template, date));
        upcoming.add(response);
      }
    }
    return upcoming;
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findByUserAndStatus(UUID userId, QuestStatus status) {
    return questOccurrenceRepository.findByUserIdAndStatus(userId, status).stream()
        .filter(o -> o.getQuestTemplate().isActive() && !o.getQuestTemplate().isDeleted())
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public QuestResponse findById(UUID id, UUID userId) {
    return questOccurrenceRepository.findByIdAndUserId(id, userId)
        .map(this::toResponse)
        .orElseGet(() -> toResponse(findTemplateByIdAndUserOrThrow(id, userId)));
  }

  @Transactional
  public void delete(UUID id, UUID userId) {
    var occurrenceOpt = questOccurrenceRepository.findByIdAndUserId(id, userId);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();
      var template = occurrence.getQuestTemplate();
      questOccurrenceRepository.delete(occurrence);
      if (template.getRecurrenceRule() == null) deleteTemplate(template);
    } else {
      deleteTemplate(findTemplateByIdAndUserOrThrow(id, userId));
    }
  }

  private void deleteTemplate(QuestTemplate template) {
    if (template.getSubquests() != null)
      template.getSubquests().stream()
          .filter(sq -> !sq.isDeleted())
          .forEach(this::deleteTemplate);

    if (template.getOccurrences() != null && !template.getOccurrences().isEmpty()) {
      var occurrences = new ArrayList<>(template.getOccurrences());
      template.getOccurrences().clear();
      questOccurrenceRepository.deleteAll(occurrences);
    }

    template.setDeleted(true);
    template.setActive(false);
    questTemplateRepository.save(template);
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findRecurringTemplates(UUID userId) {
    return questTemplateRepository
        .findByUserIdAndRecurrenceRuleTypeIsNotNullAndDeletedFalse(userId).stream()
        .map(this::toResponse)
        .toList();
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
    findTemplateByIdAndUserOrThrow(parentId, userId);
    return questTemplateRepository.findSubquestsWithOccurrences(parentId).stream()
        .map(sq -> {
          if (sq.getOccurrences() == null || sq.getOccurrences().isEmpty()) return toResponse(sq);
          return sq.getOccurrences().stream()
              .max(Comparator.comparing(QuestOccurrence::getScheduledDate))
              .map(this::toResponse)
              .orElseGet(() -> toResponse(sq));
        })
        .toList();
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findByProject(UUID projectId, UUID userId) {
    ensureDailyOccurrences(userId);
    var allOccurrences = questOccurrenceRepository.findAllByUserIdWithSubquests(userId);

    var occurrenceResponses = allOccurrences.stream()
        .filter(q -> q.getStatus() == QuestStatus.PENDING)
        .filter(q -> projectId.equals(q.getQuestTemplate().getProjectId()))
        .filter(q -> q.getQuestTemplate().isActive() && !q.getQuestTemplate().isDeleted())
        .filter(q -> q.getQuestTemplate().getParent() == null)
        .sorted((o1, o2) -> o2.getScheduledDate().compareTo(o1.getScheduledDate()))
        .map(this::toResponse)
        .toList();

    var templateIdsWithOccurrences = allOccurrences.stream()
        .map(o -> o.getQuestTemplate().getId())
        .collect(Collectors.toSet());

    var floating = questTemplateRepository.findByUserIdAndActiveTrueAndDeletedFalse(userId).stream()
        .filter(t -> projectId.equals(t.getProjectId()))
        .filter(t -> t.getRecurrenceRule() == null)
        .filter(t -> !templateIdsWithOccurrences.contains(t.getId()))
        .filter(t -> t.getParent() == null)
        .map(this::toResponse)
        .toList();

    var result = new ArrayList<QuestResponse>(floating);
    result.addAll(occurrenceResponses);
    return result;
  }

  private CategoryResponse toCategoryResponse(Category category) {
    if (category == null) return null;
    return new CategoryResponse(
        category.getId(), category.getName(), category.getIcon(),
        category.getColor(), category.isGlobal());
  }

  private int calculateXp(QuestTemplate template) {
    return (int) Math.round(template.getBaseXpReward() * template.getDifficulty().getMultiplier());
  }

  private List<Integer> toDaysOfWeek(List<DayOfWeek> days) {
    if (days == null) return null;
    return days.stream().map(DayOfWeek::getValue).toList();
  }

  private QuestResponse toResponse(QuestTemplate template) {
    return toResponse(template, null);
  }

  private QuestResponse toResponse(QuestOccurrence occurrence) {
    return toResponse(occurrence.getQuestTemplate(), occurrence);
  }

  private QuestResponse toResponse(QuestTemplate template, QuestOccurrence occurrence) {
    var categoryResponse = toCategoryResponse(template.getCategory());

    var id = template.getId();
    Instant dueDate = null;
    var status = QuestStatus.PENDING;
    Instant completedAt = null;

    if (occurrence != null) {
      id = occurrence.getId();
      dueDate = occurrence.getScheduledDate().atStartOfDay(ZoneOffset.UTC).toInstant();
      status = occurrence.getStatus();
      completedAt = occurrence.getCompletedAt();
    }

    var totalXp = calculateXp(template);

    List<Integer> recurrenceDays = null;
    var recurrenceType = RecurrenceType.NONE;
    if (template.getRecurrenceRule() != null) {
      recurrenceType = template.getRecurrenceRule().getType();
      recurrenceDays = toDaysOfWeek(template.getRecurrenceRule().getDaysOfWeek());
    }

    var subquestCount = 0;
    var completedSubquestCount = 0;
    if (template.getSubquests() != null && !template.getSubquests().isEmpty()) {
      var active = template.getSubquests().stream()
          .filter(sq -> !sq.isDeleted() && sq.isActive()).toList();
      subquestCount = active.size();
      completedSubquestCount = (int) active.stream()
          .filter(sq -> sq.getOccurrences() != null && sq.getOccurrences().stream()
              .max(Comparator.comparing(QuestOccurrence::getScheduledDate))
              .map(o -> o.getStatus() == QuestStatus.COMPLETED)
              .orElse(false))
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
        template.getProjectId(),
        dueDate,
        completedAt,
        template.getCreatedAt(),
        template.getUpdatedAt(),
        recurrenceType,
        recurrenceDays,
        template.getParent() != null ? template.getParent().getId() : null,
        template.getParent() != null ? template.getParent().getTitle() : null,
        subquestCount,
        completedSubquestCount);
  }

  private QuestResponse toGhostResponse(QuestTemplate template, LocalDate scheduledDate) {
    var categoryResponse = toCategoryResponse(template.getCategory());
    var totalXp = calculateXp(template);

    List<Integer> recurrenceDays = null;
    var recurrenceType = RecurrenceType.NONE;
    if (template.getRecurrenceRule() != null) {
      recurrenceType = template.getRecurrenceRule().getType();
      recurrenceDays = toDaysOfWeek(template.getRecurrenceRule().getDaysOfWeek());
    }

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
        template.getProjectId(),
        scheduledDate.atStartOfDay(ZoneOffset.UTC).toInstant(),
        null,
        template.getCreatedAt(),
        template.getUpdatedAt(),
        recurrenceType,
        recurrenceDays,
        template.getParent() != null ? template.getParent().getId() : null,
        template.getParent() != null ? template.getParent().getTitle() : null,
        0,
        0);
  }

  private QuestTemplate findTemplateOrThrow(UUID id) {
    return questTemplateRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Quest not found: " + id));
  }

  private QuestTemplate findTemplateByIdAndUserOrThrow(UUID id, UUID userId) {
    return questTemplateRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new IllegalArgumentException("Quest not found: " + id));
  }
}
