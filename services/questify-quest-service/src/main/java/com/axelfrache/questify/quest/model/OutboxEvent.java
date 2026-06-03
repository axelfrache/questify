package com.axelfrache.questify.quest.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(schema = "quests", name = "outbox_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String routingKey;

  @Column(nullable = false, columnDefinition = "text")
  private String payload;

  @Column(nullable = false)
  private String typeId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private OutboxStatus status = OutboxStatus.PENDING;

  @Column(nullable = false)
  private Instant createdAt;

  private Instant processedAt;

  @Column(nullable = false)
  @Builder.Default
  private int attempts = 0;

  private Instant nextAttemptAt;

  @Column(columnDefinition = "text")
  private String lastError;

  @Column(length = 55)
  private String traceparent;

  @PrePersist
  void prePersist() {
    if (createdAt == null) createdAt = Instant.now();
  }
}
