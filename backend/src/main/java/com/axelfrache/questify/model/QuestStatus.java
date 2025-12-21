package com.axelfrache.questify.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum QuestStatus {
  PENDING("Pending"),
  COMPLETED("Completed"),
  CANCELLED("Cancelled");

  private final String label;
}
