package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.Category;
import com.axelfrache.questify.model.QuestTemplate;
import com.axelfrache.questify.model.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestTemplateRepository extends JpaRepository<QuestTemplate, UUID> {
  List<QuestTemplate> findByUserAndDeletedFalseOrderByCreatedAtDesc(User user);

  List<QuestTemplate> findByUserAndActiveTrueAndDeletedFalse(User user);

  List<QuestTemplate> findByUserAndActiveTrue(User user);

  List<QuestTemplate> findByUserAndRecurrenceRuleIsNotNullAndDeletedFalse(User user);

  List<QuestTemplate> findByCategoryAndDeletedFalse(Category category);

  @Query(
      "SELECT DISTINCT qt FROM QuestTemplate qt "
          + "LEFT JOIN FETCH qt.subquests sq "
          + "WHERE qt.parent IS NULL "
          + "AND qt.recurrenceRule IS NULL "
          + "AND qt.project IS NULL "
          + "AND qt.deleted = false "
          + "AND qt.user IS NOT NULL")
  List<QuestTemplate> findLegacyProjectRoots();

  @Query("SELECT q FROM QuestTemplate q WHERE q.id = :id AND q.user.id = :userId")
  Optional<QuestTemplate> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

  @Modifying
  @Query("UPDATE QuestTemplate q SET q.parent = null WHERE q.user = :user")
  void nullifyParentForUser(@Param("user") User user);

  List<QuestTemplate> findByProject_Id(UUID projectId);

  @Modifying
  @Query("UPDATE QuestTemplate q SET q.project = null WHERE q.project.id = :projectId")
  void clearProjectByProjectId(@Param("projectId") UUID projectId);

  void deleteAllByUser(User user);
}
