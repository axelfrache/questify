package com.axelfrache.questify.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "user_project_pins",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uk_user_project_pins_user_project",
            columnNames = {"user_id", "project_id"}),
    indexes = {
      @Index(name = "idx_user_project_pins_user_id", columnList = "user_id"),
      @Index(name = "idx_user_project_pins_pinned_at", columnList = "pinned_at")
    })
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProjectPin {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @CreationTimestamp
  @Column(name = "pinned_at", nullable = false, updatable = false)
  private Instant pinnedAt;
}
