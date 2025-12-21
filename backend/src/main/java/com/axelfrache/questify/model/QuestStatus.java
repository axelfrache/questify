package com.axelfrache.questify.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum QuestStatus {
  PENDING("Pending"),
  COMPLETED("Completed"),
  CANCELLED("Cancelled"),
  SKIPPED("Skipped");

  private final String label;
}
