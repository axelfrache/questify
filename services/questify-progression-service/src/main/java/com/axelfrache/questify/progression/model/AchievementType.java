package com.axelfrache.questify.progression.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AchievementType {
  GENERAL("General"),
  CATEGORY("Category");

  private final String label;
}
