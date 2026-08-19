package com.axelfrache.questify.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "projects",
    indexes = {
      @Index(name = "idx_projects_owner_user_id", columnList = "owner_user_id"),
      @Index(name = "idx_projects_updated_at", columnList = "updated_at")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "owner_user_id", nullable = false)
  private UUID ownerUserId;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(length = 2000)
  private String description;

  @Column(length = 10)
  private String icon;

  @Column(name = "invite_link_token", unique = true)
  private String inviteLinkToken;

  @Column(name = "invite_link_enabled", nullable = false)
  @Builder.Default
  private boolean inviteLinkEnabled = false;

  @Enumerated(EnumType.STRING)
  @Column(name = "invite_link_role", nullable = false, length = 20)
  @Builder.Default
  private ProjectRole inviteLinkRole = ProjectRole.MEMBER;

  private Instant archivedAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;
}
