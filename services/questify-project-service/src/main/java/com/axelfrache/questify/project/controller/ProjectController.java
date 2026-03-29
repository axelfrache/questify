package com.axelfrache.questify.project.controller;

import com.axelfrache.questify.project.dto.CreateProjectRequest;
import com.axelfrache.questify.project.dto.ProjectDetailResponse;
import com.axelfrache.questify.project.dto.ProjectSidebarResponse;
import com.axelfrache.questify.project.dto.ProjectSummaryResponse;
import com.axelfrache.questify.project.dto.UpdateProjectRequest;
import com.axelfrache.questify.project.service.ProjectService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

  private final ProjectService projectService;

  @GetMapping("/sidebar")
  public ResponseEntity<ProjectSidebarResponse> getSidebar(
      @AuthenticationPrincipal String userId) {
    return ResponseEntity.ok(projectService.getSidebar(UUID.fromString(userId)));
  }

  @GetMapping
  public ResponseEntity<Page<ProjectSummaryResponse>> list(
      @AuthenticationPrincipal String userId,
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "recent") String sort,
      @RequestParam(defaultValue = "false") boolean includeArchived,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return ResponseEntity.ok(
        projectService.list(UUID.fromString(userId), search, sort, includeArchived, page, size));
  }

  @PostMapping
  public ResponseEntity<ProjectDetailResponse> create(
      @AuthenticationPrincipal String userId,
      @Valid @RequestBody CreateProjectRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(projectService.create(UUID.fromString(userId), request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ProjectDetailResponse> findById(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(projectService.findById(id, UUID.fromString(userId)));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<ProjectDetailResponse> update(
      @AuthenticationPrincipal String userId,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateProjectRequest request) {
    return ResponseEntity.ok(projectService.update(id, UUID.fromString(userId), request));
  }

  @PostMapping("/{id}/pin")
  public ResponseEntity<Void> pin(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    projectService.pin(id, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}/pin")
  public ResponseEntity<Void> unpin(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    projectService.unpin(id, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    projectService.delete(id, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }
}
