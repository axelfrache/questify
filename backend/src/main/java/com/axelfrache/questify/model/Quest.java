package com.axelfrache.questify.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "quests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quest {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotBlank @Size(min = 1, max = 200) @Column(nullable = false)
  private String title;

  @Size(max = 2000) private String description;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  @Column(nullable = false)
  private Difficulty difficulty = Difficulty.MEDIUM;

  @Positive @Builder.Default
  @Column(nullable = false)
  private int baseXpReward = 50;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  @Column(nullable = false)
  private QuestStatus status = QuestStatus.PENDING;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id")
  private Category category;

  private Instant dueDate;

  private Instant completedAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;

  public int calculateTotalXpReward() {
    return (int) Math.round(baseXpReward * difficulty.getMultiplier());
  }
}
