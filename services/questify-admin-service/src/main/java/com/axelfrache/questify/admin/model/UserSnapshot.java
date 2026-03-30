package com.axelfrache.questify.admin.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(
    name = "user_snapshots",
    indexes = {
      @Index(name = "idx_user_snapshots_username", columnList = "username"),
      @Index(name = "idx_user_snapshots_email", columnList = "email")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSnapshot {

  @Id private UUID id;

  @Column(nullable = false)
  private String username;

  @Column(nullable = false)
  private String email;

  @Column(nullable = false)
  private String role;

  @Column(nullable = false)
  @Builder.Default
  private boolean enabled = true;

  @Column(nullable = false)
  private Instant createdAt;
}
