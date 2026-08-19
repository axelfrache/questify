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
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "project_invitations",
    indexes = {@Index(name = "idx_project_invitations_token", columnList = "token", unique = true)})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectInvitation {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @Column(nullable = false, unique = true)
  private String token;

  @Column(length = 320)
  private String email;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private ProjectRole role = ProjectRole.MEMBER;

  @Column(nullable = false)
  private Instant expiresAt;

  @Column(name = "accepted_by_user_id")
  private UUID acceptedByUserId;

  @Column(name = "accepted_at")
  private Instant acceptedAt;

  @Column(name = "cancelled_at")
  private Instant cancelledAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }

  public boolean isAccepted() {
    return acceptedByUserId != null;
  }

  public boolean isCancelled() {
    return cancelledAt != null;
  }

  public boolean isPending() {
    return !isAccepted() && !isCancelled() && !isExpired();
  }
}
