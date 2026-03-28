package com.axelfrache.questify.progression.repository;

import com.axelfrache.questify.progression.model.QuestCompletionRecord;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestCompletionRecordRepository extends JpaRepository<QuestCompletionRecord, UUID> {

  /** Used by achievement checks that need all records (e.g. total count). */
  long countByUserId(UUID userId);

  /** Used for streak checks: loads only records within the relevant date window. */
  List<QuestCompletionRecord> findByUserIdAndCompletedAtBetween(
      UUID userId, Instant from, Instant to);

  /** Used for category-based achievement checks. */
  long countByUserIdAndCategoryNameIgnoreCase(UUID userId, String categoryName);

  void deleteByUserId(UUID userId);
}
