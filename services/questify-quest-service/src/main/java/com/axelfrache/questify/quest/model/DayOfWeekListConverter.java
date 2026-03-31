package com.axelfrache.questify.quest.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.DayOfWeek;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class DayOfWeekListConverter implements AttributeConverter<List<DayOfWeek>, String> {

  @Override
  public String convertToDatabaseColumn(List<DayOfWeek> attribute) {
    if (attribute == null || attribute.isEmpty()) return null;
    return attribute.stream()
        .map(d -> String.valueOf(d.getValue()))
        .collect(Collectors.joining(","));
  }

  @Override
  public List<DayOfWeek> convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isBlank()) return List.of();
    return Arrays.stream(dbData.split(","))
        .map(String::trim)
        .map(Integer::parseInt)
        .map(DayOfWeek::of)
        .toList();
  }
}
