package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.CategoryResponse;
import com.axelfrache.questify.dto.CreateCategoryRequest;
import com.axelfrache.questify.model.QuestAction;
import com.axelfrache.questify.security.SecurityUtils;
import com.axelfrache.questify.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

  private final CategoryService categoryService;
  private final SecurityUtils securityUtils;

  @PostMapping
  public ResponseEntity<CategoryResponse> create(
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CreateCategoryRequest request) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(userId, request));
  }

  @GetMapping
  public ResponseEntity<List<CategoryResponse>> findAll(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(categoryService.findAllForUser(userId));
  }

  @PutMapping("/{id}")
  public ResponseEntity<CategoryResponse> update(
      @AuthenticationPrincipal UserDetails userDetails,
      @PathVariable UUID id,
      @Valid @RequestBody CreateCategoryRequest request) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(categoryService.update(id, request, userId));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal UserDetails userDetails,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "MOVE_TO_INBOX") QuestAction questAction) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    categoryService.delete(id, questAction, userId);
    return ResponseEntity.noContent().build();
  }
}
