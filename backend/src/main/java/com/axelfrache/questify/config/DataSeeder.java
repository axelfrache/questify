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
    // seedGlobalCategories();
    seedAchievements();
  }

  // private void seedGlobalCategories() {
  // createGlobalCategoryIfNotExists("Health & Fitness", "🏃", "#10B981");
  // createGlobalCategoryIfNotExists("Work & Career", "💼", "#3B82F6");
  // createGlobalCategoryIfNotExists("Learning & Growth", "📚", "#8B5CF6");
  // createGlobalCategoryIfNotExists("Home & Life", "🏠", "#F59E0B");
  // createGlobalCategoryIfNotExists("Finance", "💰", "#059669");
  // createGlobalCategoryIfNotExists("Hobbies", "🎨", "#EC4899");
  // }

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

  private void createGlobalCategoryIfNotExists(String name, String icon, String color) {
    if (!categoryRepository.existsByNameAndUserIsNull(name)) {
      var category = Category.builder().name(name).icon(icon).color(color).user(null).build();
      categoryRepository.save(category);
      log.info("Created global category: {}", name);
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
