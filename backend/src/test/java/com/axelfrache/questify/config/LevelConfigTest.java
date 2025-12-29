package com.axelfrache.questify.config;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class LevelConfigTest {

  private LevelConfig levelConfig;

  @BeforeEach
  void setUp() {
    levelConfig = new LevelConfig();
    levelConfig.setBaseXp(100);
    levelConfig.setMultiplier(1.0);
  }

  @Test
  void requiredXpForLevel_shouldReturnBaseXp_whenLevel1() {

    long xp = levelConfig.requiredXpForLevel(1);

    assertEquals(100, xp);
  }

  @Test
  void requiredXpForLevel_shouldScaleLinearly_whenHigherLevel() {

    long xpLevel5 = levelConfig.requiredXpForLevel(5);
    long xpLevel10 = levelConfig.requiredXpForLevel(10);

    assertEquals(500, xpLevel5);
    assertEquals(1000, xpLevel10);
  }

  @Test
  void requiredXpForLevel_shouldApplyMultiplier() {
    levelConfig.setMultiplier(1.5);

    long xp = levelConfig.requiredXpForLevel(2);

    assertEquals(300, xp);
  }

  @Test
  void totalXpForLevel_shouldSumAllPreviousLevels() {

    long totalForLevel3 = levelConfig.totalXpForLevel(3);

    // Level 1: 100, Level 2: 200, Level 3: 300 => 100 + 200 + 300 = 600
    assertEquals(600, totalForLevel3);
  }

  @Test
  void totalXpForLevel_shouldReturnZero_whenLevel0() {

    long total = levelConfig.totalXpForLevel(0);

    assertEquals(0, total);
  }
}
