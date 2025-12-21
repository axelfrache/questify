package com.axelfrache.questify.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotBlank @Size(min = 3, max = 50) @Column(unique = true, nullable = false)
  private String username;

  @Email @NotBlank @Column(unique = true, nullable = false)
  private String email;

  @NotBlank @Column(nullable = false)
  private String password;

  @Builder.Default
  @Column(nullable = false)
  private long totalXp = 0;

  @Builder.Default
  @Column(nullable = false)
  private String timezone = "UTC";

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;

  public ZoneId getZoneId() {
    return ZoneId.of(timezone);
  }
}
