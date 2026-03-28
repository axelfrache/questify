package com.axelfrache.questify.quest.controller;

import com.axelfrache.questify.quest.dto.CategoryResponse;
import com.axelfrache.questify.quest.dto.CreateCategoryRequest;
import com.axelfrache.questify.quest.model.QuestAction;
import com.axelfrache.questify.quest.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

  private final CategoryService categoryService;

  @PostMapping
  public ResponseEntity<CategoryResponse> create(
      @AuthenticationPrincipal String userId,
      @Valid @RequestBody CreateCategoryRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(categoryService.create(UUID.fromString(userId), request));
  }

  @GetMapping
  public ResponseEntity<List<CategoryResponse>> findAll(@AuthenticationPrincipal String userId) {
    return ResponseEntity.ok(categoryService.findAllForUser(UUID.fromString(userId)));
  }

  @PutMapping("/{id}")
  public ResponseEntity<CategoryResponse> update(
      @AuthenticationPrincipal String userId,
      @PathVariable UUID id,
      @Valid @RequestBody CreateCategoryRequest request) {
    return ResponseEntity.ok(categoryService.update(id, request, UUID.fromString(userId)));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal String userId,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "MOVE_TO_INBOX") QuestAction questAction) {
    categoryService.delete(id, questAction, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }
}
