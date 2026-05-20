package com.axelfrache.questify.quest.repository;

import com.axelfrache.questify.quest.model.QuestOccurrence;
import com.axelfrache.questify.quest.model.QuestStatus;
import com.axelfrache.questify.quest.model.QuestTemplate;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestOccurrenceRepository extends JpaRepository<QuestOccurrence, UUID> {

  List<QuestOccurrence> findByQuestTemplate(QuestTemplate questTemplate);

  @Query(
      "SELECT qo FROM QuestOccurrence qo WHERE qo.questTemplate.userId = :userId AND qo.status = :status")
  List<QuestOccurrence> findByUserIdAndStatus(
      @Param("userId") UUID userId, @Param("status") QuestStatus status);

  @Query(
      "SELECT DISTINCT qo FROM QuestOccurrence qo "
          + "LEFT JOIN FETCH qo.questTemplate qt "
          + "LEFT JOIN FETCH qt.subquests "
          + "WHERE qt.userId = :userId")
  List<QuestOccurrence> findAllByUserIdWithSubquests(@Param("userId") UUID userId);

  boolean existsByQuestTemplateAndScheduledDate(
      QuestTemplate questTemplate, LocalDate scheduledDate);

  Optional<QuestOccurrence> findByQuestTemplateAndScheduledDate(
      QuestTemplate template, LocalDate scheduledDate);

  @Query(
      "SELECT qo FROM QuestOccurrence qo WHERE qo.id = :id AND qo.questTemplate.userId = :userId")
  Optional<QuestOccurrence> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

  @Query(
      "SELECT qo FROM QuestOccurrence qo WHERE qo.questTemplate.userId = :userId"
          + " AND qo.hasDueDate = true"
          + " AND qo.status = 'PENDING'"
          + " AND qo.scheduledDate > :from"
          + " AND qo.scheduledDate <= :to"
          + " AND qo.questTemplate.active = true"
          + " AND qo.questTemplate.deleted = false")
  List<QuestOccurrence> findPendingWithDueDateBetween(
      @Param("userId") UUID userId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
