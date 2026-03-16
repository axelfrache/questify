package com.axelfrache.questify.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
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

  @NotBlank @Size(min = 1, max = 120) @Column(nullable = false)
  private String name;

  @Size(max = 2000) @Column(length = 2000)
  private String description;

  @Size(max = 10) private String icon;

  private Instant archivedAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;
}
