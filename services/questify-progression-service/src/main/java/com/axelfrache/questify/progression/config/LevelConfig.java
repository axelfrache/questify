package com.axelfrache.questify.progression.config;

import java.util.concurrent.ConcurrentHashMap;
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
  private double exponent = 1.8;

  @Getter(lombok.AccessLevel.NONE)
  private final ConcurrentHashMap<Integer, Long> totalXpCache = new ConcurrentHashMap<>();

  public long requiredXpForLevel(int level) {
    return Math.round(baseXp * Math.pow(level, exponent));
  }

  public long totalXpForLevel(int level) {
    return totalXpCache.computeIfAbsent(
        level,
        l -> {
          var total = 0L;
          for (var i = 1; i <= l; i++) total += requiredXpForLevel(i);
          return total;
        });
  }
}
