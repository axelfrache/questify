package com.axelfrache.questify.quest.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
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

  @Embedded
  @Getter(AccessLevel.NONE)
  private RecurrenceRule recurrenceRule;

  public RecurrenceRule getRecurrenceRule() {
    return (recurrenceRule != null && recurrenceRule.getType() != null) ? recurrenceRule : null;
  }

  @Builder.Default
  @Column(nullable = false)
  private boolean active = true;

  @Builder.Default
  @Column(nullable = false)
  private boolean deleted = false;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "assignee_id")
  private UUID assigneeId;

  @Column(name = "project_id")
  private UUID projectId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id")
  private Category category;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  private QuestTemplate parent;

  @OneToMany(mappedBy = "parent")
  @Builder.Default
  private List<QuestTemplate> subquests = new ArrayList<>();

  @OneToMany(mappedBy = "questTemplate", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<QuestOccurrence> occurrences = new ArrayList<>();

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;
}
