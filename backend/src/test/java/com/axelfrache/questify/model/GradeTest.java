package com.axelfrache.questify.model;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class GradeTest {

  @Test
  void fromLevel_shouldReturnInitiate_whenLevel1() {
    assertEquals(Grade.INITIATE, Grade.fromLevel(1));
  }

  @Test
  void fromLevel_shouldReturnInitiate_whenLevel5() {
    assertEquals(Grade.INITIATE, Grade.fromLevel(5));
  }

  @Test
  void fromLevel_shouldReturnTraveler_whenLevel6() {
    assertEquals(Grade.TRAVELER, Grade.fromLevel(6));
  }

  @Test
  void fromLevel_shouldReturnTraveler_whenLevel10() {
    assertEquals(Grade.TRAVELER, Grade.fromLevel(10));
  }

  @Test
  void fromLevel_shouldReturnExplorer_whenLevel11() {
    assertEquals(Grade.EXPLORER, Grade.fromLevel(11));
  }

  @Test
  void fromLevel_shouldReturnExplorer_whenLevel20() {
    assertEquals(Grade.EXPLORER, Grade.fromLevel(20));
  }

  @Test
  void fromLevel_shouldReturnAdventurer_whenLevel21() {
    assertEquals(Grade.ADVENTURER, Grade.fromLevel(21));
  }

  @Test
  void fromLevel_shouldReturnHero_whenLevel36() {
    assertEquals(Grade.HERO, Grade.fromLevel(36));
  }

  @Test
  void fromLevel_shouldReturnLegend_whenLevel51() {
    assertEquals(Grade.LEGEND, Grade.fromLevel(51));
  }

  @Test
  void fromLevel_shouldReturnLegend_whenLevelExtremelyHigh() {
    assertEquals(Grade.LEGEND, Grade.fromLevel(1000));
  }

  @Test
  void fromLevel_shouldReturnLegend_whenLevelBelowMinimum() {
    assertEquals(Grade.LEGEND, Grade.fromLevel(0));
  }

  @Test
  void grade_shouldHaveCorrectLabels() {
    assertEquals("Initiate", Grade.INITIATE.getLabel());
    assertEquals("Legend", Grade.LEGEND.getLabel());
  }
}
