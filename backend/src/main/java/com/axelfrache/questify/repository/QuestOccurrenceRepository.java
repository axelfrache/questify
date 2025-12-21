package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.QuestOccurrence;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.model.QuestTemplate;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestOccurrenceRepository extends JpaRepository<QuestOccurrence, UUID> {
  List<QuestOccurrence> findByQuestTemplate(QuestTemplate questTemplate);

  @Query(
      "SELECT qo FROM QuestOccurrence qo WHERE qo.questTemplate.user.id = :userId AND qo.scheduledDate = :date")
  List<QuestOccurrence> findByUserIdAndScheduledDate(
      @Param("userId") UUID userId, @Param("date") LocalDate date);

  @Query(
      "SELECT qo FROM QuestOccurrence qo WHERE qo.questTemplate.user.id = :userId AND qo.status = :status")
  List<QuestOccurrence> findByUserIdAndStatus(
      @Param("userId") UUID userId, @Param("status") QuestStatus status);

  @Query("SELECT qo FROM QuestOccurrence qo WHERE qo.questTemplate.user.id = :userId")
  List<QuestOccurrence> findAllByUserId(@Param("userId") UUID userId);

  Optional<QuestOccurrence> findTopByQuestTemplateOrderByScheduledDateDesc(
      QuestTemplate questTemplate);

  boolean existsByQuestTemplateAndScheduledDate(
      QuestTemplate questTemplate, LocalDate scheduledDate);

  java.util.Optional<QuestOccurrence> findByQuestTemplateAndScheduledDate(
      QuestTemplate template, LocalDate scheduledDate);
}
