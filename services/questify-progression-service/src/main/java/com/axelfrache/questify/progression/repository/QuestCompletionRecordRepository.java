package com.axelfrache.questify.progression.repository;

import com.axelfrache.questify.progression.model.QuestCompletionRecord;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestCompletionRecordRepository
    extends JpaRepository<QuestCompletionRecord, UUID> {

  long countByUserId(UUID userId);

  List<QuestCompletionRecord> findByUserIdAndCompletedAtBetween(
      UUID userId, Instant from, Instant to);

  long countByUserIdAndCategoryNameIgnoreCase(UUID userId, String categoryName);

  boolean existsByUserIdAndCompletedAtBetween(UUID userId, Instant from, Instant to);

  @Query(
      "SELECT DISTINCT r.userId FROM QuestCompletionRecord r"
          + " WHERE r.completedAt >= :from AND r.completedAt < :to")
  List<UUID> findDistinctUserIdsWithCompletionBetween(
      @Param("from") Instant from, @Param("to") Instant to);

  void deleteByUserId(UUID userId);
}
