package com.axelfrache.questify.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
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
    private boolean initialized = false;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
