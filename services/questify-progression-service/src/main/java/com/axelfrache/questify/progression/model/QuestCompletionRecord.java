package com.axelfrache.questify.progression.model;

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

@Entity
@Table(
    name = "quest_completion_records",
    indexes = @Index(name = "idx_qcr_user_id", columnList = "user_id"))
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestCompletionRecord {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "quest_id", nullable = false)
  private UUID questId;

  private String categoryName;

  @Column(nullable = false)
  private Instant completedAt;
}
