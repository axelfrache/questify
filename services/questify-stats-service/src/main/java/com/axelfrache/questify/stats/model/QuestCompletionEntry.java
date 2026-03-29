package com.axelfrache.questify.stats.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "quest_completion_entries",
    indexes = {
      @Index(name = "idx_qce_user_id", columnList = "user_id"),
      @Index(name = "idx_qce_user_completed_at", columnList = "user_id, completed_at"),
      @Index(name = "idx_qce_user_category", columnList = "user_id, category_name")
    })
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestCompletionEntry {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "quest_id", nullable = false)
  private UUID questId;

  @Column(name = "quest_title", nullable = false)
  private String questTitle;

  @Column(name = "xp_earned", nullable = false)
  private int xpEarned;

  @Column(name = "category_name")
  private String categoryName;

  @Column(name = "completed_at", nullable = false)
  private Instant completedAt;

  @CreationTimestamp
  @Column(name = "recorded_at", nullable = false, updatable = false)
  private Instant recordedAt;
}
