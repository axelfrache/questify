package com.axelfrache.questify.quest.service;

import com.axelfrache.questify.quest.dto.CategoryResponse;
import com.axelfrache.questify.quest.dto.CreateCategoryRequest;
import com.axelfrache.questify.quest.model.Category;
import com.axelfrache.questify.quest.model.CategorySource;
import com.axelfrache.questify.quest.model.QuestAction;
import com.axelfrache.questify.quest.repository.CategoryRepository;
import com.axelfrache.questify.quest.repository.QuestTemplateRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

  private static final List<DefaultCategory> DEFAULT_CATEGORIES =
      List.of(
          new DefaultCategory("Work", "💼", "#3b82f6"),
          new DefaultCategory("Health", "💪", "#22c55e"),
          new DefaultCategory("Learning", "📚", "#a855f7"),
          new DefaultCategory("Personal", "🏡", "#f59e0b"));

  private final CategoryRepository categoryRepository;
  private final QuestTemplateRepository questTemplateRepository;

  @Transactional
  public CategoryResponse create(UUID userId, CreateCategoryRequest request) {
    var category =
        Category.builder()
            .name(request.name())
            .icon(request.icon())
            .color(request.color())
            .source(CategorySource.CUSTOM)
            .userId(userId)
            .build();
    categoryRepository.save(category);
    return toResponse(category);
  }

  @Transactional
  public void seedDefaultCategoriesForUser(UUID userId) {
    for (var defaultCategory : DEFAULT_CATEGORIES) {
      if (categoryRepository.existsByUserIdAndNameIgnoreCase(userId, defaultCategory.name())) {
        continue;
      }

      categoryRepository.save(
          Category.builder()
              .name(defaultCategory.name())
              .icon(defaultCategory.icon())
              .color(defaultCategory.color())
              .source(CategorySource.DEFAULT)
              .userId(userId)
              .build());
    }
  }

  @Transactional
  public void backfillCategorySources() {
    var categories = categoryRepository.findBySourceIsNull();
    if (categories.isEmpty()) {
      return;
    }

    categories.forEach(category -> category.setSource(inferSource(category)));
    categoryRepository.saveAll(categories);
    log.info("Backfilled category source for {} categories", categories.size());
  }

  @Transactional(readOnly = true)
  public List<CategoryResponse> findAllForUser(UUID userId) {
    return categoryRepository.findAllForUser(userId).stream().map(this::toResponse).toList();
  }

  @Transactional
  public CategoryResponse update(UUID categoryId, CreateCategoryRequest request, UUID userId) {
    var category = findOrThrow(categoryId);
    validateOwnership(category, userId);

    if (request.name() != null) category.setName(request.name());
    if (request.icon() != null) category.setIcon(request.icon());
    if (request.color() != null) category.setColor(request.color());

    categoryRepository.save(category);
    return toResponse(category);
  }

  @Transactional
  public void delete(UUID categoryId, QuestAction questAction, UUID userId) {
    var category = findOrThrow(categoryId);
    validateOwnership(category, userId);

    var templates = questTemplateRepository.findByCategory(category);

    switch (questAction) {
      case MOVE_TO_INBOX -> {
        templates.forEach(template -> template.setCategory(null));
        questTemplateRepository.saveAll(templates);
      }
      case DELETE_ALL -> {
        templates.forEach(
            template -> {
              template.setDeleted(true);
              template.setCategory(null);
            });
        questTemplateRepository.saveAll(templates);
      }
    }

    categoryRepository.delete(category);
  }

  private void validateOwnership(Category category, UUID userId) {
    if (category.isGlobal()) throw new IllegalStateException("Cannot modify a global category");
    if (!userId.equals(category.getUserId()))
      throw new AccessDeniedException("Category does not belong to you");
  }

  private Category findOrThrow(UUID id) {
    return categoryRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
  }

  private CategoryResponse toResponse(Category category) {
    var source = category.getSource() != null ? category.getSource() : inferSource(category);
    return new CategoryResponse(
        category.getId(),
        category.getName(),
        category.getIcon(),
        category.getColor(),
        source,
        category.isGlobal());
  }

  private CategorySource inferSource(Category category) {
    if (category.getUserId() == null) {
      return CategorySource.GLOBAL;
    }

    return DEFAULT_CATEGORIES.stream()
            .anyMatch(defaultCategory -> defaultCategory.matches(category))
        ? CategorySource.DEFAULT
        : CategorySource.CUSTOM;
  }

  private record DefaultCategory(String name, String icon, String color) {
    private boolean matches(Category category) {
      return name.equalsIgnoreCase(category.getName())
          && icon.equals(category.getIcon())
          && color.equalsIgnoreCase(category.getColor());
    }
  }
}
