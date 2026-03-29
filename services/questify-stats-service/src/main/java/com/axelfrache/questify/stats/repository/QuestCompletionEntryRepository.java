package com.axelfrache.questify.stats.repository;

import com.axelfrache.questify.stats.dto.CategoryStatsResponse;
import com.axelfrache.questify.stats.model.QuestCompletionEntry;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestCompletionEntryRepository extends JpaRepository<QuestCompletionEntry, UUID> {

  Page<QuestCompletionEntry> findByUserIdOrderByCompletedAtDesc(UUID userId, Pageable pageable);

  List<QuestCompletionEntry> findByUserIdAndCompletedAtBetween(
      UUID userId, Instant from, Instant to);

  @Query("SELECT e.completedAt FROM QuestCompletionEntry e WHERE e.userId = :userId AND e.completedAt BETWEEN :from AND :to")
  List<Instant> findCompletedAtByUserIdBetween(
      @Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

  @Query("SELECT COUNT(e) FROM QuestCompletionEntry e WHERE e.userId = :userId")
  long countTotalByUserId(@Param("userId") UUID userId);

  @Query("SELECT COALESCE(SUM(e.xpEarned), 0) FROM QuestCompletionEntry e WHERE e.userId = :userId")
  long sumXpByUserId(@Param("userId") UUID userId);

  @Query("""
      SELECT new com.axelfrache.questify.stats.dto.CategoryStatsResponse(
          e.categoryName, COUNT(e), SUM(e.xpEarned)
      )
      FROM QuestCompletionEntry e
      WHERE e.userId = :userId AND e.categoryName IS NOT NULL
      GROUP BY e.categoryName
      ORDER BY COUNT(e) DESC
      """)
  List<CategoryStatsResponse> findCategoryStatsByUserId(@Param("userId") UUID userId);

  void deleteByUserId(UUID userId);
}
