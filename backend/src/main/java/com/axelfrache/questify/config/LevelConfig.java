package com.axelfrache.questify.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "questify.level")
@Getter
@Setter
public class LevelConfig {

  private int baseXp = 100;
  private double multiplier = 1.0;

  public long requiredXpForLevel(int level) {
    return Math.round(baseXp * level * multiplier);
  }

  public long totalXpForLevel(int level) {
    var total = 0L;
    for (var i = 1; i <= level; i++) total += requiredXpForLevel(i);
    return total;
  }
}
