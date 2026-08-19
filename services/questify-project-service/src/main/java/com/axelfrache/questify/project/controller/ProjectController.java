package com.axelfrache.questify.project.controller;

import com.axelfrache.questify.project.dto.CreateInvitationRequest;
import com.axelfrache.questify.project.dto.CreateProjectRequest;
import com.axelfrache.questify.project.dto.InviteResponse;
import com.axelfrache.questify.project.dto.PendingInvitationResponse;
import com.axelfrache.questify.project.dto.ProjectDetailResponse;
import com.axelfrache.questify.project.dto.ProjectMemberResponse;
import com.axelfrache.questify.project.dto.ProjectSidebarResponse;
import com.axelfrache.questify.project.dto.ProjectSummaryResponse;
import com.axelfrache.questify.project.dto.UpdateMemberRoleRequest;
import com.axelfrache.questify.project.dto.UpdateProjectRequest;
import com.axelfrache.questify.project.service.ProjectService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
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
  public ResponseEntity<ProjectSidebarResponse> getSidebar(@AuthenticationPrincipal String userId) {
    return ResponseEntity.ok(projectService.getSidebar(UUID.fromString(userId)));
  }

  @GetMapping
  public ResponseEntity<List<ProjectSummaryResponse>> list(
      @AuthenticationPrincipal String userId,
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "recent") String sort,
      @RequestParam(defaultValue = "false") boolean includeArchived) {
    return ResponseEntity.ok(
        projectService.list(UUID.fromString(userId), search, sort, includeArchived));
  }

  @PostMapping
  public ResponseEntity<ProjectDetailResponse> create(
      @AuthenticationPrincipal String userId, @Valid @RequestBody CreateProjectRequest request) {
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
  public ResponseEntity<Void> pin(@AuthenticationPrincipal String userId, @PathVariable UUID id) {
    projectService.pin(id, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}/pin")
  public ResponseEntity<Void> unpin(@AuthenticationPrincipal String userId, @PathVariable UUID id) {
    projectService.unpin(id, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    projectService.delete(id, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{id}/invite")
  public ResponseEntity<InviteResponse> invite(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(projectService.invite(id, UUID.fromString(userId)));
  }

  @PostMapping("/join/{token}")
  public ResponseEntity<ProjectDetailResponse> join(
      @AuthenticationPrincipal String userId, @PathVariable String token) {
    return ResponseEntity.ok(projectService.joinProject(token, UUID.fromString(userId)));
  }

  @PostMapping("/{id}/invitations")
  public ResponseEntity<PendingInvitationResponse> createInvitation(
      @AuthenticationPrincipal String userId,
      @PathVariable UUID id,
      @Valid @RequestBody CreateInvitationRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(projectService.createInvitation(id, UUID.fromString(userId), request));
  }

  @GetMapping("/{id}/invitations")
  public ResponseEntity<List<PendingInvitationResponse>> listInvitations(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(projectService.listPendingInvitations(id, UUID.fromString(userId)));
  }

  @PostMapping("/{id}/invitations/{invitationId}/resend")
  public ResponseEntity<PendingInvitationResponse> resendInvitation(
      @AuthenticationPrincipal String userId,
      @PathVariable UUID id,
      @PathVariable UUID invitationId) {
    return ResponseEntity.ok(
        projectService.resendInvitation(id, invitationId, UUID.fromString(userId)));
  }

  @DeleteMapping("/{id}/invitations/{invitationId}")
  public ResponseEntity<Void> cancelInvitation(
      @AuthenticationPrincipal String userId,
      @PathVariable UUID id,
      @PathVariable UUID invitationId) {
    projectService.cancelInvitation(id, invitationId, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/members")
  public ResponseEntity<List<ProjectMemberResponse>> listMembers(
      @AuthenticationPrincipal String userId, @PathVariable UUID id) {
    return ResponseEntity.ok(projectService.listMembers(id, UUID.fromString(userId)));
  }

  @DeleteMapping("/{id}/members/{memberId}")
  public ResponseEntity<Void> removeMember(
      @AuthenticationPrincipal String userId, @PathVariable UUID id, @PathVariable UUID memberId) {
    projectService.removeMember(id, memberId, UUID.fromString(userId));
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/members/{memberId}/role")
  public ResponseEntity<ProjectDetailResponse> changeMemberRole(
      @AuthenticationPrincipal String userId,
      @PathVariable UUID id,
      @PathVariable UUID memberId,
      @Valid @RequestBody UpdateMemberRoleRequest request) {
    return ResponseEntity.ok(
        projectService.changeMemberRole(id, memberId, request.role(), UUID.fromString(userId)));
  }
}
