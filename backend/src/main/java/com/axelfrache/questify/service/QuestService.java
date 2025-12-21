package com.axelfrache.questify.service;

import com.axelfrache.questify.dto.CategoryResponse;
import com.axelfrache.questify.dto.CreateQuestRequest;
import com.axelfrache.questify.dto.QuestResponse;
import com.axelfrache.questify.dto.UpdateQuestRequest;
import com.axelfrache.questify.model.Difficulty;
import com.axelfrache.questify.model.Quest;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.model.RecurrenceInterval;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuestService {

  private final QuestRepository questRepository;
  private final UserRepository userRepository;
  private final CategoryRepository categoryRepository;
  private final ProgressionService progressionService;

  @Transactional
  public QuestResponse create(UUID userId, CreateQuestRequest request) {
    var user = findUserOrThrow(userId);

    var category = request.categoryId() != null
        ? categoryRepository.findById(request.categoryId()).orElse(null)
        : null;

    var quest = Quest.builder()
        .title(request.title())
        .description(request.description())
        .difficulty(request.difficulty() != null ? request.difficulty() : Difficulty.MEDIUM)
        .baseXpReward(request.baseXpReward() != null ? request.baseXpReward() : 50)
        .dueDate(request.dueDate())
        .category(category)
        .user(user)
        .build();

    questRepository.save(quest);
    return toResponse(quest);
  }

  @Transactional
  public QuestResponse update(UUID questId, UpdateQuestRequest request) {
    var quest = findQuestOrThrow(questId);

    if (quest.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Cannot update a completed or cancelled quest");

    if (request.title() != null)
      quest.setTitle(request.title());
    if (request.description() != null)
      quest.setDescription(request.description());
    if (request.difficulty() != null)
      quest.setDifficulty(request.difficulty());
    if (request.dueDate() != null)
      quest.setDueDate(request.dueDate());

    questRepository.save(quest);
    return toResponse(quest);
  }

  @Transactional
  public QuestResponse complete(UUID questId) {
    var quest = findQuestOrThrow(questId);

    if (quest.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed or cancelled");

    quest.setStatus(QuestStatus.COMPLETED);
    quest.setCompletedAt(Instant.now());
    questRepository.save(quest);

    progressionService.awardXp(
        quest.getUser().getId(), quest.calculateTotalXpReward(), "Quest: " + quest.getTitle());

    handleRecurrence(quest);

    return toResponse(quest);
  }

  private void handleRecurrence(Quest quest) {
    if (quest.getRecurrenceInterval() == RecurrenceInterval.NONE) {
      return;
    }

    Instant nextDueDate = null;
    if (quest.getDueDate() != null) {
      nextDueDate = switch (quest.getRecurrenceInterval()) {
        case DAILY -> quest.getDueDate().plus(1, java.time.temporal.ChronoUnit.DAYS);
        case WEEKLY -> quest.getDueDate().plus(7, java.time.temporal.ChronoUnit.DAYS);
        case MONTHLY -> quest.getDueDate().plus(30, java.time.temporal.ChronoUnit.DAYS); // Approximate
        default -> null;
      };
    } else {
      // If no due date, base it on completion time? Or just don't set a due date?
      // Let's base it on now.
      nextDueDate = switch (quest.getRecurrenceInterval()) {
        case DAILY -> Instant.now().plus(1, java.time.temporal.ChronoUnit.DAYS);
        case WEEKLY -> Instant.now().plus(7, java.time.temporal.ChronoUnit.DAYS);
        case MONTHLY -> Instant.now().plus(30, java.time.temporal.ChronoUnit.DAYS);
        default -> null;
      };
    }

    var nextQuest = Quest.builder()
        .title(quest.getTitle())
        .description(quest.getDescription())
        .difficulty(quest.getDifficulty())
        .baseXpReward(quest.getBaseXpReward())
        .dueDate(nextDueDate)
        .recurrenceInterval(quest.getRecurrenceInterval())
        .category(quest.getCategory())
        .user(quest.getUser())
        .status(QuestStatus.PENDING)
        .build();

    questRepository.save(nextQuest);
  }

  @Transactional
  public QuestResponse cancel(UUID questId) {
    var quest = findQuestOrThrow(questId);

    if (quest.getStatus() != QuestStatus.PENDING)
      throw new IllegalStateException("Quest is already completed or cancelled");

    quest.setStatus(QuestStatus.CANCELLED);
    questRepository.save(quest);

    return toResponse(quest);
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findByUser(UUID userId) {
    var user = findUserOrThrow(userId);
    return questRepository.findByUserOrderByCreatedAtDesc(user).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<QuestResponse> findByUserAndStatus(UUID userId, QuestStatus status) {
    var user = findUserOrThrow(userId);
    return questRepository.findByUserAndStatusOrderByCreatedAtDesc(user, status).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public QuestResponse findById(UUID questId) {
    return toResponse(findQuestOrThrow(questId));
  }

  @Transactional
  public void delete(UUID questId) {
    var quest = findQuestOrThrow(questId);
    questRepository.delete(quest);
  }

  private User findUserOrThrow(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
  }

  private Quest findQuestOrThrow(UUID questId) {
    return questRepository
        .findById(questId)
        .orElseThrow(() -> new IllegalArgumentException("Quest not found: " + questId));
  }

  private QuestResponse toResponse(Quest quest) {
    var categoryResponse = quest.getCategory() != null
        ? new CategoryResponse(
            quest.getCategory().getId(),
            quest.getCategory().getName(),
            quest.getCategory().getIcon(),
            quest.getCategory().getColor(),
            quest.getCategory().isGlobal())
        : null;

    return new QuestResponse(
        quest.getId(),
        quest.getTitle(),
        quest.getDescription(),
        quest.getDifficulty(),
        quest.getBaseXpReward(),
        quest.calculateTotalXpReward(),
        quest.getStatus(),
        categoryResponse,
        quest.getDueDate(),
        quest.getCompletedAt(),
        quest.getCreatedAt(),
        quest.getUpdatedAt(),
        quest.getRecurrenceInterval());
  }
}
