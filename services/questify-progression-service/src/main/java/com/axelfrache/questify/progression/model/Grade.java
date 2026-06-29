package com.axelfrache.questify.progression.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Grade {
  FLINT("Flint", 1, 5),
  IRON("Iron", 6, 10),
  GOLD("Gold", 11, 20),
  OBSIDIAN("Obsidian", 21, 35),
  SAPPHIRE("Sapphire", 36, 50),
  DIAMOND("Diamond", 51, Integer.MAX_VALUE);

  private final String label;
  private final int minimumLevel;
  private final int maximumLevel;

  public static Grade fromLevel(int level) {
    for (var grade : values()) {
      if (level >= grade.minimumLevel && level <= grade.maximumLevel) return grade;
    }
    return DIAMOND;
  }
}
