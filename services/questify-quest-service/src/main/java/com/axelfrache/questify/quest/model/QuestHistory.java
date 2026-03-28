package com.axelfrache.questify.quest.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "quest_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestHistory {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private UUID userId;

  @Column(nullable = false)
  private UUID originalQuestId;

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Difficulty difficulty;

  @Column(nullable = false)
  private int xpEarned;

  @Column(nullable = false)
  private Instant completedAt;

  private String categoryName;
  private String categoryIcon;
  private String categoryColor;

  @Enumerated(EnumType.STRING)
  private RecurrenceType recurrenceType;

  private String parentTitle;
}
