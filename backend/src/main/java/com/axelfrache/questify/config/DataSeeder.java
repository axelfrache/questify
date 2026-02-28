package com.axelfrache.questify.config;

import com.axelfrache.questify.model.Achievement;
import com.axelfrache.questify.model.AchievementType;
import com.axelfrache.questify.model.Category;
import com.axelfrache.questify.repository.AchievementRepository;
import com.axelfrache.questify.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

  private final CategoryRepository categoryRepository;
  private final AchievementRepository achievementRepository;

  @Override
  public void run(String... args) {
    seedAchievements();
  }

  private void seedAchievements() {
    createGeneralAchievement("FIRST_STEP", "The First Step", "Complete your first quest", "🎯", 1);
    createGeneralAchievement("WEEK_STREAK", "Week Streak", "Be active 7 days in a row", "🔥", 7);
    createGeneralAchievement(
        "MONTHLY_MASTER", "Monthly Master", "Be active 30 days in a month", "🏆", 30);
    createGeneralAchievement("TEN_QUESTS", "Getting Started", "Complete 10 quests", "⭐", 10);
    createGeneralAchievement("FIFTY_QUESTS", "Quest Warrior", "Complete 50 quests", "💪", 50);
    createGeneralAchievement("HUNDRED_QUESTS", "Quest Master", "Complete 100 quests", "👑", 100);

    for (var category : categoryRepository.findByUserIsNull()) {
      createCategoryAchievement(
          "EXPLORER_" + category.getName().toUpperCase().replace(" ", "_").replace("&", "AND"),
          category.getName() + " Explorer",
          "Complete 10 quests in " + category.getName(),
          "🧭",
          10,
          category);
      createCategoryAchievement(
          "VETERAN_" + category.getName().toUpperCase().replace(" ", "_").replace("&", "AND"),
          category.getName() + " Veteran",
          "Complete 50 quests in " + category.getName(),
          "🎖️",
          50,
          category);
    }
  }

  private void createGeneralAchievement(
      String code, String name, String description, String icon, int threshold) {
    if (!achievementRepository.existsByCode(code)) {
      var achievement =
          Achievement.builder()
              .code(code)
              .name(name)
              .description(description)
              .icon(icon)
              .type(AchievementType.GENERAL)
              .threshold(threshold)
              .build();
      achievementRepository.save(achievement);
      log.info("Created achievement: {}", name);
    }
  }

  private void createCategoryAchievement(
      String code, String name, String description, String icon, int threshold, Category category) {
    if (!achievementRepository.existsByCode(code)) {
      var achievement =
          Achievement.builder()
              .code(code)
              .name(name)
              .description(description)
              .icon(icon)
              .type(AchievementType.CATEGORY)
              .threshold(threshold)
              .category(category)
              .build();
      achievementRepository.save(achievement);
      log.info("Created category achievement: {}", name);
    }
  }
}
