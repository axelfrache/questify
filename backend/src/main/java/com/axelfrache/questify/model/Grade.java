package com.axelfrache.questify.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Grade {
  INITIATE("Initiate", 1, 5),
  TRAVELER("Traveler", 6, 10),
  EXPLORER("Explorer", 11, 20),
  ADVENTURER("Adventurer", 21, 35),
  HERO("Hero", 36, 50),
  LEGEND("Legend", 51, Integer.MAX_VALUE);

  private final String label;
  private final int minimumLevel;
  private final int maximumLevel;

  public static Grade fromLevel(int level) {
    for (var grade : values()) {
      if (level >= grade.minimumLevel && level <= grade.maximumLevel) return grade;
    }
    return LEGEND;
  }
}
