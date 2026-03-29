package com.axelfrache.questify.admin.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "instance_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstanceSettings {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  @Builder.Default
  private boolean registrationEnabled = true;

  @Column(nullable = false)
  @Builder.Default
  private boolean maintenanceMode = false;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;
}
