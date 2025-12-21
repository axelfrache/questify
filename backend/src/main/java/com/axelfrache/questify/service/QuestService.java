package com.axelfrache.questify.service;

import com.axelfrache.questify.dto.CreateQuestRequest;
import com.axelfrache.questify.dto.QuestResponse;
import com.axelfrache.questify.dto.UpdateQuestRequest;
import com.axelfrache.questify.model.Difficulty;
import com.axelfrache.questify.model.Quest;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.model.User;
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
  private final ProgressionService progressionService;

  @Transactional
  public QuestResponse create(UUID userId, CreateQuestRequest request) {
    var user = findUserOrThrow(userId);

    var quest =
        Quest.builder()
            .title(request.title())
            .description(request.description())
            .difficulty(request.difficulty() != null ? request.difficulty() : Difficulty.MEDIUM)
            .baseXpReward(request.baseXpReward() != null ? request.baseXpReward() : 50)
            .dueDate(request.dueDate())
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

    if (request.title() != null) quest.setTitle(request.title());
    if (request.description() != null) quest.setDescription(request.description());
    if (request.difficulty() != null) quest.setDifficulty(request.difficulty());
    if (request.dueDate() != null) quest.setDueDate(request.dueDate());

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

    return toResponse(quest);
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
    return new QuestResponse(
        quest.getId(),
        quest.getTitle(),
        quest.getDescription(),
        quest.getDifficulty(),
        quest.getBaseXpReward(),
        quest.calculateTotalXpReward(),
        quest.getStatus(),
        quest.getDueDate(),
        quest.getCompletedAt(),
        quest.getCreatedAt(),
        quest.getUpdatedAt());
  }
}
