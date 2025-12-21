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
@Table(name = "quest_templates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestTemplate {

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

  @Embedded private RecurrenceRule recurrenceRule;

  @Builder.Default
  @Column(nullable = false)
  private boolean active = true;

  @Builder.Default
  @Column(nullable = false)
  private boolean deleted = false;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id")
  private Category category;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @OneToMany(mappedBy = "questTemplate", cascade = CascadeType.ALL, orphanRemoval = true)
  private java.util.List<QuestOccurrence> occurrences;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;
}
