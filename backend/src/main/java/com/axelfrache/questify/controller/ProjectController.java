package com.axelfrache.questify.controller;

import com.axelfrache.questify.dto.*;
import com.axelfrache.questify.security.SecurityUtils;
import com.axelfrache.questify.service.ProjectService;
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
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

  private final ProjectService projectService;
  private final SecurityUtils securityUtils;

  @GetMapping("/sidebar")
  public ResponseEntity<ProjectSidebarResponse> getSidebar(
      @AuthenticationPrincipal UserDetails userDetails) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(projectService.getSidebar(userId));
  }

  @GetMapping
  public ResponseEntity<List<ProjectSummaryResponse>> list(
      @AuthenticationPrincipal UserDetails userDetails,
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "recent") String sort,
      @RequestParam(defaultValue = "false") boolean includeArchived) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(projectService.list(userId, search, sort, includeArchived));
  }

  @PostMapping
  public ResponseEntity<ProjectDetailResponse> create(
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CreateProjectRequest request) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(userId, request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ProjectDetailResponse> findById(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(projectService.findById(id, userId));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<ProjectDetailResponse> update(
      @AuthenticationPrincipal UserDetails userDetails,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateProjectRequest request) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    return ResponseEntity.ok(projectService.update(id, userId, request));
  }

  @PostMapping("/{id}/pin")
  public ResponseEntity<Void> pin(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    projectService.pin(id, userId);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}/pin")
  public ResponseEntity<Void> unpin(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    projectService.unpin(id, userId);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
    var userId = securityUtils.getCurrentUserId(userDetails);
    projectService.delete(id, userId);
    return ResponseEntity.noContent().build();
  }
}
