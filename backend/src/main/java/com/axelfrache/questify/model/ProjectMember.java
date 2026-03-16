package com.axelfrache.questify.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "project_members",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_project_members_project_user",
          columnNames = {"project_id", "user_id"})
    },
    indexes = {
      @Index(name = "idx_project_members_user_id", columnList = "user_id"),
      @Index(name = "idx_project_members_project_id", columnList = "project_id")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMember {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ProjectRole role;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;
}
