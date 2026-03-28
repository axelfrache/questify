package com.axelfrache.questify.quest.service;

import com.axelfrache.questify.quest.dto.CategoryResponse;
import com.axelfrache.questify.quest.dto.CreateCategoryRequest;
import com.axelfrache.questify.quest.model.Category;
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

  private final CategoryRepository categoryRepository;
  private final QuestTemplateRepository questTemplateRepository;

  @Transactional
  public CategoryResponse create(UUID userId, CreateCategoryRequest request) {
    var category = Category.builder()
        .name(request.name())
        .icon(request.icon())
        .color(request.color())
        .userId(userId)
        .build();
    categoryRepository.save(category);
    return toResponse(category);
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

    var templates = questTemplateRepository.findByCategoryAndDeletedFalse(category);

    switch (questAction) {
      case MOVE_TO_INBOX -> questTemplateRepository.clearCategory(category);
      case DELETE_ALL -> {
        templates.forEach(t -> t.setDeleted(true));
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
    return categoryRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
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
