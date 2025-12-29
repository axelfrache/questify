package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.dto.CreateCategoryRequest;
import com.axelfrache.questify.model.Category;
import com.axelfrache.questify.model.QuestAction;
import com.axelfrache.questify.model.QuestTemplate;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.CategoryRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CategoryServiceTest {

  private CategoryService categoryService;
  private CategoryRepository categoryRepository;
  private QuestTemplateRepository questTemplateRepository;
  private UserRepository userRepository;

  private User testUser;
  private UUID userId;

  @BeforeEach
  void setUp() {
    categoryRepository = mock(CategoryRepository.class);
    questTemplateRepository = mock(QuestTemplateRepository.class);
    userRepository = mock(UserRepository.class);

    categoryService =
        new CategoryService(categoryRepository, questTemplateRepository, userRepository);

    userId = UUID.randomUUID();
    testUser = new User();
    testUser.setId(userId);
  }

  @Test
  void create_shouldSaveCategory_whenValidRequest() {
    var request = new CreateCategoryRequest("Health", "heart", "#FF0000");
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    var response = categoryService.create(userId, request);

    assertNotNull(response);
    assertEquals("Health", response.name());
    assertEquals("heart", response.icon());
    assertEquals("#FF0000", response.color());
    verify(categoryRepository).save(any(Category.class));
  }

  @Test
  void create_shouldThrow_whenUserNotFound() {
    var request = new CreateCategoryRequest("Health", "heart", "#FF0000");
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class, () -> categoryService.create(userId, request));
  }

  @Test
  void findAllForUser_shouldReturnUserCategories() {
    var category = createCategory("Health", false);
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(categoryRepository.findAllForUser(testUser)).thenReturn(List.of(category));

    var categories = categoryService.findAllForUser(userId);

    assertEquals(1, categories.size());
    assertEquals("Health", categories.get(0).name());
  }

  @Test
  void findGlobalCategories_shouldReturnOnlyGlobal() {
    var globalCategory = createCategory("Work", true);
    when(categoryRepository.findByUserIsNull()).thenReturn(List.of(globalCategory));

    var categories = categoryService.findGlobalCategories();

    assertEquals(1, categories.size());
    assertTrue(categories.get(0).isGlobal());
  }

  @Test
  void update_shouldModifyCategory_whenValid() {
    var categoryId = UUID.randomUUID();
    var category = createCategory("Old Name", false);
    category.setId(categoryId);
    category.setUser(testUser);

    var request = new CreateCategoryRequest("New Name", "star", "#00FF00");
    when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

    var response = categoryService.update(categoryId, request);

    assertEquals("New Name", response.name());
    assertEquals("star", response.icon());
    assertEquals("#00FF00", response.color());
    verify(categoryRepository).save(category);
  }

  @Test
  void update_shouldThrow_whenCategoryNotFound() {
    var categoryId = UUID.randomUUID();
    var request = new CreateCategoryRequest("Name", "icon", "#000000");
    when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class, () -> categoryService.update(categoryId, request));
  }

  @Test
  void update_shouldThrow_whenGlobalCategory() {
    var categoryId = UUID.randomUUID();
    var category = createCategory("Global", true);
    category.setId(categoryId);

    var request = new CreateCategoryRequest("New Name", "icon", "#000000");
    when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

    assertThrows(IllegalStateException.class, () -> categoryService.update(categoryId, request));
  }

  @Test
  void delete_shouldRemoveCategory_whenOwner() {
    var categoryId = UUID.randomUUID();
    var category = createCategory("Health", false);
    category.setId(categoryId);
    category.setUser(testUser);

    when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questTemplateRepository.findByCategoryAndDeletedFalse(category)).thenReturn(List.of());

    categoryService.delete(categoryId, QuestAction.MOVE_TO_INBOX, userId);

    verify(categoryRepository).delete(category);
  }

  @Test
  void delete_shouldMoveQuestsToInbox_whenMoveAction() {
    var categoryId = UUID.randomUUID();
    var category = createCategory("Health", false);
    category.setId(categoryId);
    category.setUser(testUser);

    var template = new QuestTemplate();
    template.setCategory(category);

    when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questTemplateRepository.findByCategoryAndDeletedFalse(category))
        .thenReturn(List.of(template));

    categoryService.delete(categoryId, QuestAction.MOVE_TO_INBOX, userId);

    assertNull(template.getCategory());
    verify(questTemplateRepository).saveAll(List.of(template));
    verify(categoryRepository).delete(category);
  }

  @Test
  void delete_shouldDeleteQuests_whenDeleteAction() {
    var categoryId = UUID.randomUUID();
    var category = createCategory("Health", false);
    category.setId(categoryId);
    category.setUser(testUser);

    var template = new QuestTemplate();
    template.setCategory(category);
    template.setDeleted(false);

    when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(questTemplateRepository.findByCategoryAndDeletedFalse(category))
        .thenReturn(List.of(template));

    categoryService.delete(categoryId, QuestAction.DELETE_ALL, userId);

    assertTrue(template.isDeleted());
    verify(questTemplateRepository).saveAll(List.of(template));
  }

  @Test
  void delete_shouldThrow_whenNotOwner() {
    var categoryId = UUID.randomUUID();
    var otherUser = new User();
    otherUser.setId(UUID.randomUUID());

    var category = createCategory("Health", false);
    category.setId(categoryId);
    category.setUser(otherUser);

    when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    assertThrows(
        IllegalStateException.class,
        () -> categoryService.delete(categoryId, QuestAction.MOVE_TO_INBOX, userId));
  }

  @Test
  void delete_shouldThrow_whenGlobalCategory() {
    var categoryId = UUID.randomUUID();
    var category = createCategory("Global", true);
    category.setId(categoryId);

    when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

    assertThrows(
        IllegalStateException.class,
        () -> categoryService.delete(categoryId, QuestAction.MOVE_TO_INBOX, userId));
  }

  private Category createCategory(String name, boolean isGlobal) {
    var category = new Category();
    category.setId(UUID.randomUUID());
    category.setName(name);
    category.setIcon("icon");
    category.setColor("#000000");
    if (!isGlobal) {
      category.setUser(testUser);
    }
    return category;
  }
}
