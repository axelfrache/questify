package com.axelfrache.questify.quest.repository;

import com.axelfrache.questify.quest.model.Category;
import com.axelfrache.questify.quest.model.QuestTemplate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestTemplateRepository extends JpaRepository<QuestTemplate, UUID> {

  List<QuestTemplate> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(UUID userId);

  List<QuestTemplate> findByUserIdAndActiveTrueAndDeletedFalse(UUID userId);

  List<QuestTemplate> findByUserIdAndRecurrenceRuleTypeIsNotNullAndDeletedFalse(UUID userId);

  List<QuestTemplate> findByCategory(Category category);

  @Query("SELECT q FROM QuestTemplate q WHERE q.id = :id AND q.userId = :userId")
  Optional<QuestTemplate> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

  @Query(
      """
      SELECT DISTINCT sq FROM QuestTemplate sq
      LEFT JOIN FETCH sq.occurrences
      WHERE sq.parent.id = :parentId
        AND sq.deleted = false AND sq.active = true
      """)
  List<QuestTemplate> findSubquestsWithOccurrences(@Param("parentId") UUID parentId);

  @Modifying
  @Query("UPDATE QuestTemplate q SET q.projectId = null WHERE q.projectId = :projectId")
  void clearProjectByProjectId(@Param("projectId") UUID projectId);

  void deleteByUserId(UUID userId);
}
