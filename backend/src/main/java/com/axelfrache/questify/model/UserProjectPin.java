package com.axelfrache.questify.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "user_project_pins",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_user_project_pins_user_project",
          columnNames = {"user_id", "project_id"})
    },
    indexes = {
      @Index(name = "idx_user_project_pins_user_id", columnList = "user_id"),
      @Index(name = "idx_user_project_pins_pinned_at", columnList = "pinned_at")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProjectPin {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @CreationTimestamp
  @Column(name = "pinned_at", nullable = false, updatable = false)
  private Instant pinnedAt;
}
