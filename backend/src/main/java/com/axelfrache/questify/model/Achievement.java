package com.axelfrache.questify.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "achievements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Achievement {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotBlank @Column(nullable = false, unique = true)
  private String code;

  @NotBlank @Column(nullable = false)
  private String name;

  private String description;

  private String icon;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AchievementType type;

  @Positive @Column(nullable = false)
  private int threshold;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id")
  private Category category;
}
