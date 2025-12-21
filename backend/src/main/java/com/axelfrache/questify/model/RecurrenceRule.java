package com.axelfrache.questify.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.DayOfWeek;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurrenceRule {

  @Enumerated(EnumType.STRING)
  private RecurrenceType type;

  @jakarta.persistence.Column(name = "recurrence_interval")
  private Integer interval;

  private List<DayOfWeek> daysOfWeek;
}
