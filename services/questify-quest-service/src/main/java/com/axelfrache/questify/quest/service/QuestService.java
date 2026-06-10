package com.axelfrache.questify.quest.service;

import com.axelfrache.questify.quest.dto.CategoryResponse;
import com.axelfrache.questify.quest.dto.CreateQuestRequest;
import com.axelfrache.questify.quest.dto.QuestResponse;
import com.axelfrache.questify.quest.dto.UpdateQuestRequest;
import com.axelfrache.questify.quest.messaging.QuestEventPublisher;
import com.axelfrache.questify.quest.model.Category;
import com.axelfrache.questify.quest.model.CategorySource;
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
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
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

  @WithSpan("quest.create")
  @Transactional
  public QuestResponse create(UUID userId, CreateQuestRequest request) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.parent.id", request.parentId());
    setUuidAttribute("questify.quest.category.id", request.categoryId());
    setEnumAttribute("questify.quest.difficulty", request.difficulty());
    Span.current().setAttribute("questify.quest.has_due_date", request.dueDate() != null);

    var category =
        request.categoryId() != null
            ? categoryRepository.findById(request.categoryId()).orElse(null)
            : null;

    RecurrenceRule recurrenceRule = null;
    if (request.recurrenceInterval() != null
        && request.recurrenceInterval() != RecurrenceType.NONE) {
      var daysOfWeek =
          request.recurrenceDays() != null
              ? request.recurrenceDays().stream().map(DayOfWeek::of).toList()
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
      if (parent.getParent() != null)
        throw new IllegalArgumentException("Subquests cannot have children (max depth = 1)");
      if (parent.getRecurrenceRule() != null && recurrenceRule != null)
        throw new IllegalArgumentException(
            "Subquests of a recurring quest cannot have their own recurrence (Checklist Mode)");
    }

    var template =
        QuestTemplate.builder()
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
    setQuestTemplateAttributes(template);
    log.info(
        "Quest created quest_id={} title=\"{}\" difficulty={} recurrence={} user={}",
        template.getId(),
        template.getTitle(),
        template.getDifficulty(),
        recurrenceRule != null ? recurrenceRule.getType() : "none",
        userId);

    if (recurrenceRule == null) {
      if (request.dueDate() != null) {
        var scheduledDate = request.dueDate().atZone(ZoneOffset.UTC).toLocalDate();
        var occurrence =
            QuestOccurrence.builder()
                .questTemplate(template)
                .scheduledDate(scheduledDate)
                .status(QuestStatus.PENDING)
                .hasDueDate(true)
                .build();
        questOccurrenceRepository.save(occurrence);
        questEventPublisher.publishQuestScheduled(
            userId, template.getId(), occurrence.getId(), template.getTitle(), scheduledDate);
        return toResponse(occurrence);
      }
      return toResponse(template);
    }

    ensureDailyOccurrences(userId);
    return toResponse(template);
  }

  @WithSpan("quest.update")
  @Transactional
  public QuestResponse update(UUID id, UUID userId, UpdateQuestRequest request) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.requested_id", id);
    setUuidAttribute("questify.project.id", request.projectId());
    setUuidAttribute("questify.quest.category.id", request.categoryId());
    setEnumAttribute("questify.quest.difficulty", request.difficulty());
    Span.current().setAttribute("questify.quest.has_due_date_update", request.dueDate() != null);

    var occurrenceOpt = questOccurrenceRepository.findByIdAndUserId(id, userId);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();
      Span.current().setAttribute("questify.quest.target", "occurrence");
      setQuestOccurrenceAttributes(occurrence);

      if (request.dueDate() != null) {
        if (occurrence.getStatus() != QuestStatus.PENDING)
          throw new IllegalStateException(
              "Cannot update the due date of a completed or cancelled quest occurrence");
        var newDate = request.dueDate().atZone(ZoneOffset.UTC).toLocalDate();
        occurrence.setScheduledDate(newDate);
        questEventPublisher.publishQuestScheduled(
            userId,
            occurrence.getQuestTemplate().getId(),
            occurrence.getId(),
            occurrence.getQuestTemplate().getTitle(),
            newDate);
      }

      var template = occurrence.getQuestTemplate();
      updateTemplateFields(template, request, userId);
      questTemplateRepository.save(template);

      if (request.recurrenceDays() != null && template.getRecurrenceRule() != null) {
        var selectedDays = template.getRecurrenceRule().getDaysOfWeek();
        if (selectedDays != null && !selectedDays.isEmpty()) {
          var toDelete =
              questOccurrenceRepository.findByQuestTemplate(template).stream()
                  .filter(o -> o.getStatus() == QuestStatus.PENDING)
                  .filter(o -> !selectedDays.contains(o.getScheduledDate().getDayOfWeek()))
                  .toList();
          var currentDeleted =
              toDelete.stream().anyMatch(o -> o.getId().equals(occurrence.getId()));
          questOccurrenceRepository.deleteAll(toDelete);
          if (currentDeleted) return toResponse(template);
        }
      }

      questOccurrenceRepository.save(occurrence);
      return toResponse(occurrence);
    }

    var template = findTemplateByIdAndUserOrThrow(id, userId);
    Span.current().setAttribute("questify.quest.target", "template");
    setQuestTemplateAttributes(template);
    updateTemplateFields(template, request, userId);
    questTemplateRepository.save(template);

    if (request.dueDate() != null && template.getRecurrenceRule() == null) {
      var scheduledDate = request.dueDate().atZone(ZoneOffset.UTC).toLocalDate();
      return questOccurrenceRepository
          .findByQuestTemplateAndScheduledDate(template, scheduledDate)
          .map(this::toResponse)
          .orElseGet(
              () -> {
                var occurrence =
                    QuestOccurrence.builder()
                        .questTemplate(template)
                        .scheduledDate(scheduledDate)
                        .status(QuestStatus.PENDING)
                        .hasDueDate(true)
                        .build();
                questOccurrenceRepository.save(occurrence);
                questEventPublisher.publishQuestScheduled(
                    userId,
                    template.getId(),
                    occurrence.getId(),
                    template.getTitle(),
                    scheduledDate);
                return toResponse(occurrence);
              });
    }

    return toResponse(template);
  }

  private void updateTemplateFields(
      QuestTemplate template, UpdateQuestRequest request, UUID userId) {
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

        var rule =
            template.getRecurrenceRule() != null
                ? template.getRecurrenceRule()
                : RecurrenceRule.builder().interval(1).build();
        rule.setType(request.recurrenceInterval());
        if (request.recurrenceDays() != null)
          rule.setDaysOfWeek(request.recurrenceDays().stream().map(DayOfWeek::of).toList());
        template.setRecurrenceRule(rule);
      }
    } else if (request.recurrenceDays() != null && template.getRecurrenceRule() != null) {
      template
          .getRecurrenceRule()
          .setDaysOfWeek(request.recurrenceDays().stream().map(DayOfWeek::of).toList());
    }
  }

  @WithSpan("quest.complete")
  @Transactional
  public QuestResponse complete(UUID id, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.requested_id", id);
    log.info("Completing quest occurrence={} user={}", id, userId);
    var occurrence = questOccurrenceRepository.findByIdAndOwnerOrAssignee(id, userId).orElse(null);

    if (occurrence == null) {
      var template =
          questTemplateRepository
              .findByIdAndOwnerOrAssignee(id, userId)
              .orElseThrow(() -> new IllegalArgumentException("Quest not found: " + id));
      occurrence =
          QuestOccurrence.builder()
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
    var xpEarned =
        (int) Math.round(template.getBaseXpReward() * template.getDifficulty().getMultiplier());
    occurrence.setXpEarned(xpEarned);
    questOccurrenceRepository.save(occurrence);
    setQuestOccurrenceAttributes(occurrence);
    Span.current().setAttribute("questify.xp.awarded", xpEarned);

    log.info(
        "Quest completed quest_id={} title=\"{}\" difficulty={} xp_earned={} completer={} owner={}",
        template.getId(),
        template.getTitle(),
        template.getDifficulty(),
        xpEarned,
        userId,
        template.getUserId());

    var categoryName = template.getCategory() != null ? template.getCategory().getName() : null;
    questEventPublisher.publishQuestCompleted(
        template.getUserId(),
        template.getId(),
        template.getTitle(),
        xpEarned,
        categoryName,
        occurrence.getCompletedAt(),
        userId);
    saveToHistory(occurrence, xpEarned, userId);

    return toResponse(occurrence);
  }

  @WithSpan("quest.assign")
  @Transactional
  public QuestResponse assign(UUID id, UUID requesterId, UUID assigneeId) {
    setUuidAttribute("questify.user.id", requesterId);
    setUuidAttribute("questify.quest.requested_id", id);
    setUuidAttribute("questify.quest.assignee_id", assigneeId);
    var template = findTemplateByIdAndUserOrThrow(id, requesterId);
    template.setAssigneeId(assigneeId);
    questTemplateRepository.save(template);
    log.info("Quest assigned quest_id={} assignee={} by={}", id, assigneeId, requesterId);
    return toResponse(template);
  }

  private void saveToHistory(QuestOccurrence occurrence, int xpEarned, UUID completerId) {
    var template = occurrence.getQuestTemplate();
    var category = template.getCategory();
    var history =
        QuestHistory.builder()
            .userId(completerId)
            .originalQuestId(template.getId())
            .title(template.getTitle())
            .description(template.getDescription())
            .difficulty(template.getDifficulty())
            .xpEarned(xpEarned)
            .completedAt(occurrence.getCompletedAt())
            .categoryName(category != null ? category.getName() : null)
            .categoryIcon(category != null ? category.getIcon() : null)
            .categoryColor(category != null ? category.getColor() : null)
            .recurrenceType(
                template.getRecurrenceRule() != null
                    ? template.getRecurrenceRule().getType()
                    : RecurrenceType.NONE)
            .parentTitle(template.getParent() != null ? template.getParent().getTitle() : null)
            .build();
    questHistoryRepository.save(history);
  }

  @WithSpan("quest.cancel")
  @Transactional
  public QuestResponse cancel(UUID id, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.requested_id", id);
    log.info("Cancelling quest occurrence={} user={}", id, userId);
    var occurrenceOpt = questOccurrenceRepository.findByIdAndUserId(id, userId);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();
      Span.current().setAttribute("questify.quest.target", "occurrence");
      setQuestOccurrenceAttributes(occurrence);
      if (occurrence.getStatus() != QuestStatus.PENDING)
        throw new IllegalStateException("Quest is already completed or cancelled");
      occurrence.setStatus(QuestStatus.CANCELLED);
      questOccurrenceRepository.save(occurrence);
      log.info(
          "Quest occurrence cancelled quest_id={} user={}",
          occurrence.getQuestTemplate().getId(),
          userId);
      return toResponse(occurrence);
    }

    var template = findTemplateByIdAndUserOrThrow(id, userId);
    Span.current().setAttribute("questify.quest.target", "template");
    setQuestTemplateAttributes(template);
    template.setActive(false);
    questTemplateRepository.save(template);
    log.info("Quest template deactivated quest_id={} user={}", template.getId(), userId);
    return toResponse(template);
  }

  @WithSpan("quest.skip")
  @Transactional
  public QuestResponse skip(UUID id, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.occurrence.id", id);
    var occurrence =
        questOccurrenceRepository
            .findByIdAndUserId(id, userId)
            .orElseThrow(() -> new IllegalArgumentException("Quest occurrence not found: " + id));

    if (occurrence.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed, cancelled or skipped");

    var today = LocalDate.now(ZoneOffset.UTC);
    if (occurrence.getScheduledDate().isAfter(today))
      throw new IllegalStateException("Cannot skip a future quest occurrence");

    occurrence.setStatus(QuestStatus.SKIPPED);
    questOccurrenceRepository.save(occurrence);
    setQuestOccurrenceAttributes(occurrence);
    return toResponse(occurrence);
  }

  @WithSpan("quest.ensure_daily_occurrences")
  @Transactional
  public void ensureDailyOccurrences(UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    var templates = questTemplateRepository.findByUserIdAndActiveTrueAndDeletedFalse(userId);
    Span.current().setAttribute("questify.quest.template_count", templates.size());
    var today = LocalDate.now(ZoneOffset.UTC);

    for (var template : templates) {
      if (template.getRecurrenceRule() == null) continue;

      autoSkipPast(template, today);

      if (shouldGenerate(template, today)
          && !questOccurrenceRepository.existsByQuestTemplateAndScheduledDate(template, today)) {
        questOccurrenceRepository.save(
            QuestOccurrence.builder()
                .questTemplate(template)
                .scheduledDate(today)
                .status(QuestStatus.PENDING)
                .build());

        if (template.getSubquests() != null) {
          for (var sub : template.getSubquests()) {
            if (sub.isActive() && !sub.isDeleted()) {
              autoSkipPast(sub, today);
              if (!questOccurrenceRepository.existsByQuestTemplateAndScheduledDate(sub, today)) {
                questOccurrenceRepository.save(
                    QuestOccurrence.builder()
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
    var toSkip =
        questOccurrenceRepository.findByQuestTemplate(template).stream()
            .filter(
                o -> o.getStatus() == QuestStatus.PENDING && o.getScheduledDate().isBefore(today))
            .peek(o -> o.setStatus(QuestStatus.SKIPPED))
            .toList();
    if (!toSkip.isEmpty()) questOccurrenceRepository.saveAll(toSkip);
  }

  private boolean shouldGenerate(QuestTemplate template, LocalDate date) {
    var rule = template.getRecurrenceRule();
    if (rule == null || rule.getType() == null) return false;
    return switch (rule.getType()) {
      case DAILY -> true;
      case WEEKLY ->
          rule.getDaysOfWeek() == null
              || rule.getDaysOfWeek().isEmpty()
              || rule.getDaysOfWeek().contains(date.getDayOfWeek());
      case MONTHLY ->
          date.getDayOfMonth() == template.getCreatedAt().atZone(ZoneOffset.UTC).getDayOfMonth();
      case CUSTOM -> true;
      case NONE -> false;
    };
  }

  @WithSpan("quest.find_by_user")
  @Transactional(readOnly = true)
  public List<QuestResponse> findByUser(UUID userId) {
    return questTemplateRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId).stream()
        .map(this::toResponse)
        .toList();
  }

  @WithSpan("quest.find_today")
  @Transactional
  public List<QuestResponse> findTodayQuests(UUID userId) {
    ensureDailyOccurrences(userId);
    var today = LocalDate.now(ZoneOffset.UTC);
    return questOccurrenceRepository.findAllByUserIdWithSubquests(userId).stream()
        .filter(q -> q.getStatus() != QuestStatus.SKIPPED)
        .filter(q -> q.getQuestTemplate().isActive() && !q.getQuestTemplate().isDeleted())
        .filter(q -> q.getScheduledDate().equals(today))
        .filter(
            q ->
                !(q.getQuestTemplate().getSubquests() != null
                    && !q.getQuestTemplate().getSubquests().isEmpty()
                    && q.getQuestTemplate().getRecurrenceRule() == null))
        .sorted(Comparator.comparing(QuestOccurrence::getScheduledDate))
        .map(this::toResponse)
        .toList();
  }

  @WithSpan("quest.find_inbox")
  @Transactional
  public List<QuestResponse> findInboxQuests(UUID userId) {
    ensureDailyOccurrences(userId);
    var allOccurrences = questOccurrenceRepository.findAllByUserIdWithSubquests(userId);

    var occurrenceResponses =
        allOccurrences.stream()
            .filter(q -> q.getStatus() == QuestStatus.PENDING)
            .filter(q -> q.getQuestTemplate().isActive() && !q.getQuestTemplate().isDeleted())
            .filter(q -> q.getQuestTemplate().getParent() == null)
            .sorted((o1, o2) -> o2.getScheduledDate().compareTo(o1.getScheduledDate()))
            .map(this::toResponse)
            .toList();

    var templateIdsWithOccurrences =
        allOccurrences.stream().map(o -> o.getQuestTemplate().getId()).collect(Collectors.toSet());

    var floating =
        questTemplateRepository.findByUserIdAndActiveTrueAndDeletedFalse(userId).stream()
            .filter(t -> t.getRecurrenceRule() == null)
            .filter(t -> !templateIdsWithOccurrences.contains(t.getId()))
            .filter(t -> t.getParent() == null)
            .map(this::toResponse)
            .toList();

    var result = new ArrayList<QuestResponse>(floating);
    result.addAll(occurrenceResponses);
    return result;
  }

  @WithSpan("quest.find_upcoming")
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

        final var capturedDate = date;
        var response =
            questOccurrenceRepository
                .findByQuestTemplateAndScheduledDate(template, capturedDate)
                .map(this::toResponse)
                .orElseGet(() -> toGhostResponse(template, capturedDate));
        upcoming.add(response);
      }
    }

    questOccurrenceRepository.findPendingWithDueDateBetween(userId, today, endDate).stream()
        .map(this::toResponse)
        .forEach(upcoming::add);

    return upcoming;
  }

  @WithSpan("quest.find_by_status")
  @Transactional(readOnly = true)
  public List<QuestResponse> findByUserAndStatus(UUID userId, QuestStatus status) {
    setUuidAttribute("questify.user.id", userId);
    setEnumAttribute("questify.quest.status", status);
    return questOccurrenceRepository.findByUserIdAndStatus(userId, status).stream()
        .filter(o -> o.getQuestTemplate().isActive() && !o.getQuestTemplate().isDeleted())
        .map(this::toResponse)
        .toList();
  }

  @WithSpan("quest.find_by_id")
  @Transactional(readOnly = true)
  public QuestResponse findById(UUID id, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.requested_id", id);
    return questOccurrenceRepository
        .findByIdAndUserId(id, userId)
        .map(this::toResponse)
        .orElseGet(() -> toResponse(findTemplateByIdAndUserOrThrow(id, userId)));
  }

  @WithSpan("quest.delete")
  @Transactional
  public void delete(UUID id, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.requested_id", id);
    var occurrenceOpt = questOccurrenceRepository.findByIdAndUserId(id, userId);
    if (occurrenceOpt.isPresent()) {
      var occurrence = occurrenceOpt.get();
      var template = occurrence.getQuestTemplate();
      Span.current().setAttribute("questify.quest.target", "occurrence");
      setQuestOccurrenceAttributes(occurrence);
      questOccurrenceRepository.delete(occurrence);
      if (template.getRecurrenceRule() == null) {
        deleteTemplate(template);
        questEventPublisher.publishQuestDeleted(userId, template.getId(), null);
      } else {
        questEventPublisher.publishQuestDeleted(userId, template.getId(), occurrence.getId());
      }
    } else {
      var template = findTemplateByIdAndUserOrThrow(id, userId);
      Span.current().setAttribute("questify.quest.target", "template");
      setQuestTemplateAttributes(template);
      deleteTemplate(template);
      questEventPublisher.publishQuestDeleted(userId, template.getId(), null);
    }
  }

  private void deleteTemplate(QuestTemplate template) {
    if (template.getSubquests() != null)
      template.getSubquests().stream().filter(sq -> !sq.isDeleted()).forEach(this::deleteTemplate);

    if (template.getOccurrences() != null && !template.getOccurrences().isEmpty()) {
      var occurrences = new ArrayList<>(template.getOccurrences());
      template.getOccurrences().clear();
      questOccurrenceRepository.deleteAll(occurrences);
    }

    template.setDeleted(true);
    template.setActive(false);
    questTemplateRepository.save(template);
  }

  @WithSpan("quest.find_recurring_templates")
  @Transactional(readOnly = true)
  public List<QuestResponse> findRecurringTemplates(UUID userId) {
    return questTemplateRepository
        .findByUserIdAndRecurrenceRuleTypeIsNotNullAndDeletedFalse(userId)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  @WithSpan("quest.toggle_active")
  @Transactional
  public QuestResponse toggleActive(UUID id, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    var template = findTemplateByIdAndUserOrThrow(id, userId);
    template.setActive(!template.isActive());
    questTemplateRepository.save(template);
    setQuestTemplateAttributes(template);
    return toResponse(template);
  }

  @WithSpan("quest.find_subquests")
  @Transactional(readOnly = true)
  public List<QuestResponse> findSubquests(UUID parentId, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.quest.parent.id", parentId);
    findTemplateByIdAndUserOrThrow(parentId, userId);
    return questTemplateRepository.findSubquestsWithOccurrences(parentId).stream()
        .map(
            sq -> {
              if (sq.getOccurrences() == null || sq.getOccurrences().isEmpty())
                return toResponse(sq);
              return sq.getOccurrences().stream()
                  .max(Comparator.comparing(QuestOccurrence::getScheduledDate))
                  .map(this::toResponse)
                  .orElseGet(() -> toResponse(sq));
            })
        .toList();
  }

  @WithSpan("quest.find_by_project")
  @Transactional
  public List<QuestResponse> findByProject(UUID projectId, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.project.id", projectId);
    ensureDailyOccurrences(userId);

    var allOccurrences = questOccurrenceRepository.findAllByProjectIdWithSubquests(projectId);

    var occurrenceResponses =
        allOccurrences.stream()
            .filter(q -> q.getStatus() != QuestStatus.CANCELLED)
            .filter(q -> q.getQuestTemplate().getParent() == null)
            .sorted((o1, o2) -> o2.getScheduledDate().compareTo(o1.getScheduledDate()))
            .map(this::toResponse)
            .toList();

    var templateIdsWithOccurrences =
        allOccurrences.stream().map(o -> o.getQuestTemplate().getId()).collect(Collectors.toSet());

    var floating =
        questTemplateRepository.findByProjectIdAndActiveTrueAndDeletedFalse(projectId).stream()
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
    var source =
        category.getSource() != null ? category.getSource() : inferCategorySource(category);
    return new CategoryResponse(
        category.getId(),
        category.getName(),
        category.getIcon(),
        category.getColor(),
        source,
        category.isGlobal());
  }

  private int calculateXp(QuestTemplate template) {
    return (int) Math.round(template.getBaseXpReward() * template.getDifficulty().getMultiplier());
  }

  private void setQuestOccurrenceAttributes(QuestOccurrence occurrence) {
    if (occurrence == null) return;
    setUuidAttribute("questify.quest.occurrence.id", occurrence.getId());
    setEnumAttribute("questify.quest.status", occurrence.getStatus());
    setQuestTemplateAttributes(occurrence.getQuestTemplate());
  }

  private void setQuestTemplateAttributes(QuestTemplate template) {
    if (template == null) return;
    setUuidAttribute("questify.quest.id", template.getId());
    setUuidAttribute("questify.project.id", template.getProjectId());
    setUuidAttribute(
        "questify.quest.parent.id",
        template.getParent() != null ? template.getParent().getId() : null);
    setEnumAttribute("questify.quest.difficulty", template.getDifficulty());
    Span.current().setAttribute("questify.quest.base_xp_reward", template.getBaseXpReward());
    Span.current().setAttribute("questify.quest.active", template.isActive());
    Span.current().setAttribute("questify.quest.has_parent", template.getParent() != null);
    Span.current().setAttribute("questify.quest.has_category", template.getCategory() != null);
    Span.current()
        .setAttribute("questify.quest.recurrence.enabled", template.getRecurrenceRule() != null);
    if (template.getRecurrenceRule() != null) {
      setEnumAttribute("questify.quest.recurrence.type", template.getRecurrenceRule().getType());
      setEnumAttribute("questify.quest.frequency", template.getRecurrenceRule().getType());
    } else {
      Span.current().setAttribute("questify.quest.frequency", "NONE");
    }
  }

  private static void setUuidAttribute(String key, UUID value) {
    if (value != null) Span.current().setAttribute(key, value.toString());
  }

  private static void setEnumAttribute(String key, Enum<?> value) {
    if (value != null) Span.current().setAttribute(key, value.name());
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
      var active =
          template.getSubquests().stream().filter(sq -> !sq.isDeleted() && sq.isActive()).toList();
      subquestCount = active.size();
      completedSubquestCount =
          (int)
              active.stream()
                  .filter(
                      sq ->
                          sq.getOccurrences() != null
                              && sq.getOccurrences().stream()
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
        completedSubquestCount,
        template.getAssigneeId());
  }

  private CategorySource inferCategorySource(Category category) {
    if (category.getUserId() == null) {
      return CategorySource.GLOBAL;
    }

    if ("Work".equalsIgnoreCase(category.getName())
        && "💼".equals(category.getIcon())
        && "#3b82f6".equalsIgnoreCase(category.getColor())) {
      return CategorySource.DEFAULT;
    }
    if ("Health".equalsIgnoreCase(category.getName())
        && "💪".equals(category.getIcon())
        && "#22c55e".equalsIgnoreCase(category.getColor())) {
      return CategorySource.DEFAULT;
    }
    if ("Learning".equalsIgnoreCase(category.getName())
        && "📚".equals(category.getIcon())
        && "#a855f7".equalsIgnoreCase(category.getColor())) {
      return CategorySource.DEFAULT;
    }
    if ("Personal".equalsIgnoreCase(category.getName())
        && "🏡".equals(category.getIcon())
        && "#f59e0b".equalsIgnoreCase(category.getColor())) {
      return CategorySource.DEFAULT;
    }

    return CategorySource.CUSTOM;
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
        0,
        template.getAssigneeId());
  }

  private QuestTemplate findTemplateOrThrow(UUID id) {
    return questTemplateRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Quest not found: " + id));
  }

  private QuestTemplate findTemplateByIdAndUserOrThrow(UUID id, UUID userId) {
    return questTemplateRepository
        .findByIdAndUserId(id, userId)
        .orElseThrow(() -> new IllegalArgumentException("Quest not found: " + id));
  }
}
