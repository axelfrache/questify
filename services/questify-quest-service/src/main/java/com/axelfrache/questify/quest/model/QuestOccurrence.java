package com.axelfrache.questify.quest.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "quest_occurrences",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"quest_template_id", "scheduled_date"})})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestOccurrence {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "quest_template_id", nullable = false)
  private QuestTemplate questTemplate;

  @Column(name = "scheduled_date", nullable = false)
  private LocalDate scheduledDate;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  @Column(nullable = false)
  private QuestStatus status = QuestStatus.PENDING;

  private Instant completedAt;

  @Builder.Default
  @Column(nullable = false)
  private boolean hasDueDate = false;

  private int xpEarned;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;
}
