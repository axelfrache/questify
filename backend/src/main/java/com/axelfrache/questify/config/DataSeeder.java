package com.axelfrache.questify.config;

import com.axelfrache.questify.model.Category;
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

  @Override
  public void run(String... args) {
    seedGlobalCategories();
  }

  private void seedGlobalCategories() {
    createGlobalCategoryIfNotExists("Health & Fitness", "🏃", "#10B981");
    createGlobalCategoryIfNotExists("Work & Career", "💼", "#3B82F6");
    createGlobalCategoryIfNotExists("Learning & Growth", "📚", "#8B5CF6");
    createGlobalCategoryIfNotExists("Home & Life", "🏠", "#F59E0B");
    createGlobalCategoryIfNotExists("Finance", "💰", "#059669");
    createGlobalCategoryIfNotExists("Hobbies", "🎨", "#EC4899");
  }

  private void createGlobalCategoryIfNotExists(String name, String icon, String color) {
    if (!categoryRepository.existsByNameAndUserIsNull(name)) {
      var category = Category.builder().name(name).icon(icon).color(color).user(null).build();
      categoryRepository.save(category);
      log.info("Created global category: {}", name);
    }
  }
}
