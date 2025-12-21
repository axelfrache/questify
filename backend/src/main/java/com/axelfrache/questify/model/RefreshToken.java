package com.axelfrache.questify.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, unique = true)
  private String token;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false)
  private Instant expiryDate;

  @Builder.Default
  @Column(nullable = false)
  private boolean revoked = false;

  public boolean isExpired() {
    return Instant.now().isAfter(expiryDate);
  }

  public boolean isValid() {
    return !revoked && !isExpired();
  }
}
