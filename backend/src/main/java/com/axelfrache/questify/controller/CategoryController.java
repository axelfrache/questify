package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.CategoryResponse;
import com.axelfrache.questify.dto.CreateCategoryRequest;
import com.axelfrache.questify.repository.UserRepository;
import com.axelfrache.questify.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

  private final CategoryService categoryService;
  private final UserRepository userRepository;

  @PostMapping
  public ResponseEntity<CategoryResponse> create(
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CreateCategoryRequest request) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(categoryService.create(userId, request));
  }

  @GetMapping
  public ResponseEntity<List<CategoryResponse>> findAll(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = getUserId(userDetails);
    return ResponseEntity.ok(categoryService.findAllForUser(userId));
  }

  @PutMapping("/{id}")
  public ResponseEntity<CategoryResponse> update(
      @PathVariable UUID id, @Valid @RequestBody CreateCategoryRequest request) {
    return ResponseEntity.ok(categoryService.update(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    categoryService.delete(id);
    return ResponseEntity.noContent().build();
  }

  private UUID getUserId(UserDetails userDetails) {
    return userRepository
        .findByEmail(userDetails.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("User not found"))
        .getId();
  }
}
