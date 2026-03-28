package com.axelfrache.questify.quest.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Difficulty {
  EASY("Easy", 1.0),
  MEDIUM("Medium", 1.5),
  HARD("Hard", 2.0),
  EPIC("Epic", 3.0);

  private final String label;
  private final double multiplier;
}
