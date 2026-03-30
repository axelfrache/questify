package com.axelfrache.questify.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
    name = "project_members",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uk_project_members_project_user",
            columnNames = {"project_id", "user_id"}),
    indexes = {
      @Index(name = "idx_project_members_user_id", columnList = "user_id"),
      @Index(name = "idx_project_members_project_id", columnList = "project_id")
    })
@Getter
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

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ProjectRole role;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;
}
