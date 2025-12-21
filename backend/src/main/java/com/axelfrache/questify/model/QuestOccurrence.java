package com.axelfrache.questify.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "quest_occurrences",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"quest_template_id", "scheduledDate"})})
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

  @Column(nullable = false)
  private LocalDate scheduledDate;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  @Column(nullable = false)
  private QuestStatus status = QuestStatus.PENDING;

  private Instant completedAt;

  private int xpEarned;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;
}
