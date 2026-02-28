package com.axelfrache.questify.service;

import com.axelfrache.questify.dto.CategoryResponse;
import com.axelfrache.questify.dto.CreateCategoryRequest;
import com.axelfrache.questify.model.Category;
import com.axelfrache.questify.model.QuestAction;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryService {

  private final CategoryRepository categoryRepository;
  private final QuestTemplateRepository questTemplateRepository;
  private final UserRepository userRepository;

  @Transactional
  public CategoryResponse create(UUID userId, CreateCategoryRequest request) {
    var user = findUserOrThrow(userId);

    var category =
        Category.builder()
            .name(request.name())
            .icon(request.icon())
            .color(request.color())
            .user(user)
            .build();

    categoryRepository.save(category);
    return toResponse(category);
  }

  @Transactional(readOnly = true)
  public List<CategoryResponse> findAllForUser(UUID userId) {
    var user = findUserOrThrow(userId);
    return categoryRepository.findAllForUser(user).stream().map(this::toResponse).toList();
  }

  @Transactional(readOnly = true)
  public List<CategoryResponse> findGlobalCategories() {
    return categoryRepository.findByUserIsNull().stream().map(this::toResponse).toList();
  }

  @Transactional
  public CategoryResponse update(UUID categoryId, CreateCategoryRequest request, UUID userId) {
    var category = findCategoryOrThrow(categoryId);
    var user = findUserOrThrow(userId);

    if (category.isGlobal()) throw new IllegalStateException("Cannot update global category");
    if (category.getUser() == null || !category.getUser().getId().equals(user.getId())) {
      throw new IllegalStateException("Cannot update category that doesn't belong to you");
    }

    if (request.name() != null) category.setName(request.name());
    if (request.icon() != null) category.setIcon(request.icon());
    if (request.color() != null) category.setColor(request.color());

    categoryRepository.save(category);
    return toResponse(category);
  }

  @Transactional
  public void delete(UUID categoryId, QuestAction questAction, UUID userId) {
    var category = findCategoryOrThrow(categoryId);
    var user = findUserOrThrow(userId);

    if (category.isGlobal()) throw new IllegalStateException("Cannot delete global category");

    if (category.getUser() == null || !category.getUser().getId().equals(user.getId())) {
      throw new IllegalStateException("Cannot delete category that doesn't belong to you");
    }

    var questTemplates = questTemplateRepository.findByCategoryAndDeletedFalse(category);

    switch (questAction) {
      case MOVE_TO_INBOX -> {
        for (var template : questTemplates) {
          template.setCategory(null);
        }
        questTemplateRepository.saveAll(questTemplates);
      }
      case DELETE_ALL -> {
        for (var template : questTemplates) {
          template.setDeleted(true);
        }
        questTemplateRepository.saveAll(questTemplates);
      }
    }

    categoryRepository.delete(category);
  }

  private User findUserOrThrow(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
  }

  private Category findCategoryOrThrow(UUID categoryId) {
    return categoryRepository
        .findById(categoryId)
        .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));
  }

  private CategoryResponse toResponse(Category category) {
    return new CategoryResponse(
        category.getId(),
        category.getName(),
        category.getIcon(),
        category.getColor(),
        category.isGlobal());
  }
}
