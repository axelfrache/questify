package com.axelfrache.questify.quest.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.DayOfWeek;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurrenceRule {

  @Enumerated(EnumType.STRING)
  @Column(name = "recurrence_type")
  private RecurrenceType type;

  @Column(name = "recurrence_interval")
  private Integer interval;

  @Convert(converter = DayOfWeekListConverter.class)
  @Column(name = "recurrence_days_of_week")
  private List<DayOfWeek> daysOfWeek;
}
