package com.axelfrache.questify.project.service;

import com.axelfrache.questify.project.dto.CreateInvitationRequest;
import com.axelfrache.questify.project.dto.CreateProjectRequest;
import com.axelfrache.questify.project.dto.InviteResponse;
import com.axelfrache.questify.project.dto.PendingInvitationResponse;
import com.axelfrache.questify.project.dto.ProjectDetailResponse;
import com.axelfrache.questify.project.dto.ProjectMemberResponse;
import com.axelfrache.questify.project.dto.ProjectSidebarResponse;
import com.axelfrache.questify.project.dto.ProjectSummaryResponse;
import com.axelfrache.questify.project.dto.UpdateProjectRequest;
import com.axelfrache.questify.project.messaging.ProjectEventPublisher;
import com.axelfrache.questify.project.model.Project;
import com.axelfrache.questify.project.model.ProjectInvitation;
import com.axelfrache.questify.project.model.ProjectMember;
import com.axelfrache.questify.project.model.ProjectRole;
import com.axelfrache.questify.project.model.UserProjectPin;
import com.axelfrache.questify.project.repository.ProjectInvitationRepository;
import com.axelfrache.questify.project.repository.ProjectMemberRepository;
import com.axelfrache.questify.project.repository.ProjectRepository;
import com.axelfrache.questify.project.repository.UserProjectPinRepository;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

  private static final int SIDEBAR_PINNED_LIMIT = 6;
  private static final int SIDEBAR_RECENT_LIMIT = 4;
  private static final String DEFAULT_PROJECT_ICON = "📁";

  private static final Duration INVITE_TTL = Duration.ofDays(7);

  private final ProjectRepository projectRepository;
  private final ProjectMemberRepository projectMemberRepository;
  private final ProjectInvitationRepository projectInvitationRepository;
  private final UserProjectPinRepository userProjectPinRepository;
  private final ProjectEventPublisher projectEventPublisher;
  private final MailService mailService;

  @Value("${questify.app.public-url:http://localhost:80}")
  private String appPublicUrl;

  @WithSpan("project.get_sidebar")
  @Transactional(readOnly = true)
  public ProjectSidebarResponse getSidebar(UUID userId) {
    var projects = projectRepository.findAllByMemberUserId(userId);
    var projectById = projects.stream().collect(Collectors.toMap(Project::getId, p -> p));

    var pinned =
        userProjectPinRepository.findPinnedProjectIdsByUserIdOrderByPinnedAtDesc(userId).stream()
            .map(projectById::get)
            .filter(Objects::nonNull)
            .limit(SIDEBAR_PINNED_LIMIT)
            .map(p -> toSummary(p, true))
            .toList();

    var pinnedIds = pinned.stream().map(ProjectSummaryResponse::id).collect(Collectors.toSet());

    var recent =
        projects.stream()
            .filter(p -> !pinnedIds.contains(p.getId()))
            .sorted(Comparator.comparing(Project::getUpdatedAt).reversed())
            .limit(SIDEBAR_RECENT_LIMIT)
            .map(p -> toSummary(p, false))
            .toList();

    return new ProjectSidebarResponse(pinned, recent);
  }

  @WithSpan("project.list")
  @Transactional(readOnly = true)
  public List<ProjectSummaryResponse> list(
      UUID userId, String search, String sort, boolean includeArchived) {
    var pinnedIds =
        new HashSet<>(
            userProjectPinRepository.findPinnedProjectIdsByUserIdOrderByPinnedAtDesc(userId));
    var normalizedSearch = search != null ? search.trim().toLowerCase() : "";

    Comparator<Project> comparator =
        "name".equalsIgnoreCase(sort)
            ? Comparator.comparing(p -> p.getName().toLowerCase())
            : Comparator.comparing(Project::getUpdatedAt).reversed();

    return projectRepository
        .findAllByMemberUserIdFiltered(userId, normalizedSearch, includeArchived)
        .stream()
        .sorted(comparator)
        .map(p -> toSummary(p, pinnedIds.contains(p.getId())))
        .toList();
  }

  @WithSpan("project.create")
  @Transactional
  public ProjectDetailResponse create(UUID userId, CreateProjectRequest request) {
    setUuidAttribute("questify.user.id", userId);
    var project =
        projectRepository.save(
            Project.builder()
                .ownerUserId(userId)
                .name(request.name().trim())
                .description(normalizeDescription(request.description()))
                .icon(resolveIcon(request.icon()))
                .build());

    projectMemberRepository.save(
        ProjectMember.builder().project(project).userId(userId).role(ProjectRole.OWNER).build());
    setProjectAttributes(project);

    return toDetail(project, false);
  }

  @WithSpan("project.find_by_id")
  @Transactional(readOnly = true)
  public ProjectDetailResponse findById(UUID projectId, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.project.id", projectId);
    var project = requireMember(projectId, userId);
    var pinned = userProjectPinRepository.existsByUserIdAndProject(userId, project);
    return toDetail(project, pinned);
  }

  @WithSpan("project.update")
  @Transactional
  public ProjectDetailResponse update(UUID projectId, UUID userId, UpdateProjectRequest request) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.project.id", projectId);
    var project = requireMember(projectId, userId);

    if (request.name() != null) {
      var trimmedName = request.name().trim();
      if (trimmedName.isBlank()) throw new IllegalArgumentException("Project name cannot be blank");
      project.setName(trimmedName);
    }
    if (request.description() != null)
      project.setDescription(normalizeDescription(request.description()));
    if (request.icon() != null) project.setIcon(resolveIcon(request.icon()));
    if (request.archived() != null)
      project.setArchivedAt(request.archived() ? Instant.now() : null);

    projectRepository.save(project);
    setProjectAttributes(project);
    var pinned = userProjectPinRepository.existsByUserIdAndProject(userId, project);
    return toDetail(project, pinned);
  }

  @WithSpan("project.pin")
  @Transactional
  public void pin(UUID projectId, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.project.id", projectId);
    var project = requireMember(projectId, userId);
    setProjectAttributes(project);
    if (project.getArchivedAt() != null)
      throw new IllegalStateException("Archived projects cannot be pinned");
    try {
      userProjectPinRepository.save(
          UserProjectPin.builder().userId(userId).project(project).build());
    } catch (DataIntegrityViolationException ignored) {
    }
  }

  @WithSpan("project.unpin")
  @Transactional
  public void unpin(UUID projectId, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.project.id", projectId);
    var project = requireMember(projectId, userId);
    setProjectAttributes(project);
    userProjectPinRepository.deleteByUserIdAndProject(userId, project);
  }

  @WithSpan("project.delete")
  @Transactional
  public void delete(UUID projectId, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    setUuidAttribute("questify.project.id", projectId);
    var projectOpt = projectRepository.findById(projectId);
    if (projectOpt.isEmpty()) return;

    var project = projectOpt.get();
    setProjectAttributes(project);
    var membership =
        projectMemberRepository
            .findByProjectAndUserId(project, userId)
            .orElseThrow(() -> new AccessDeniedException("Access denied to this project"));

    if (membership.getRole() != ProjectRole.OWNER)
      throw new AccessDeniedException("Only the project owner can delete this project");

    userProjectPinRepository.deleteByProject(project);
    projectInvitationRepository.deleteByProject(project);
    projectMemberRepository.deleteByProject(project);
    projectRepository.delete(project);

    projectEventPublisher.publishProjectDeleted(projectId);
  }

  @WithSpan("project.invite")
  @Transactional
  public InviteResponse invite(UUID projectId, UUID requesterId) {
    setUuidAttribute("questify.project.id", projectId);
    setUuidAttribute("questify.user.id", requesterId);
    var project = findProjectOrThrow(projectId);
    requireManageMembers(project, requesterId);

    var token = UUID.randomUUID().toString();
    var expiresAt = Instant.now().plus(INVITE_TTL);
    projectInvitationRepository.save(
        ProjectInvitation.builder().project(project).token(token).expiresAt(expiresAt).build());
    log.info("Invite created project_id={} expires={}", projectId, expiresAt);
    return new InviteResponse(token, expiresAt);
  }

  @WithSpan("project.create_invitation")
  @Transactional
  public PendingInvitationResponse createInvitation(
      UUID projectId, UUID requesterId, CreateInvitationRequest request) {
    setUuidAttribute("questify.project.id", projectId);
    setUuidAttribute("questify.user.id", requesterId);
    if (request.role() == ProjectRole.OWNER)
      throw new IllegalArgumentException("Cannot invite someone as owner");

    var project = findProjectOrThrow(projectId);
    var requester = requireManageMembers(project, requesterId);
    if (requester.getRole() == ProjectRole.ADMIN && request.role() == ProjectRole.ADMIN)
      throw new AccessDeniedException("Only the owner can invite admins");

    var token = UUID.randomUUID().toString();
    var invitation =
        projectInvitationRepository.save(
            ProjectInvitation.builder()
                .project(project)
                .token(token)
                .email(request.email().trim())
                .role(request.role())
                .expiresAt(Instant.now().plus(INVITE_TTL))
                .build());
    mailService.sendProjectInvitationEmail(
        invitation.getEmail(), project.getName(), invitation.getRole(), buildJoinUrl(token));
    log.info(
        "Invitation created project_id={} email={} role={}",
        projectId,
        invitation.getEmail(),
        invitation.getRole());
    return toPending(invitation);
  }

  @WithSpan("project.list_invitations")
  @Transactional(readOnly = true)
  public List<PendingInvitationResponse> listPendingInvitations(UUID projectId, UUID requesterId) {
    var project = findProjectOrThrow(projectId);
    requireManageMembers(project, requesterId);
    return projectInvitationRepository
        .findByProjectAndAcceptedAtIsNullAndCancelledAtIsNullOrderByCreatedAtDesc(project)
        .stream()
        .filter(inv -> inv.getEmail() != null)
        .map(this::toPending)
        .toList();
  }

  @WithSpan("project.resend_invitation")
  @Transactional
  public PendingInvitationResponse resendInvitation(
      UUID projectId, UUID invitationId, UUID requesterId) {
    var project = findProjectOrThrow(projectId);
    requireManageMembers(project, requesterId);
    var invitation = findInvitationOrThrow(project, invitationId);
    if (invitation.isAccepted() || invitation.isCancelled())
      throw new IllegalStateException("This invitation is no longer active");
    if (invitation.getEmail() == null)
      throw new IllegalArgumentException("This invitation has no email to resend to");

    invitation.setExpiresAt(Instant.now().plus(INVITE_TTL));
    projectInvitationRepository.save(invitation);
    mailService.sendProjectInvitationEmail(
        invitation.getEmail(),
        project.getName(),
        invitation.getRole(),
        buildJoinUrl(invitation.getToken()));
    log.info("Invitation resent project_id={} email={}", projectId, invitation.getEmail());
    return toPending(invitation);
  }

  @WithSpan("project.cancel_invitation")
  @Transactional
  public void cancelInvitation(UUID projectId, UUID invitationId, UUID requesterId) {
    var project = findProjectOrThrow(projectId);
    requireManageMembers(project, requesterId);
    var invitation = findInvitationOrThrow(project, invitationId);
    if (invitation.isAccepted())
      throw new IllegalStateException("This invitation has already been accepted");
    invitation.setCancelledAt(Instant.now());
    projectInvitationRepository.save(invitation);
    log.info("Invitation cancelled project_id={} invitation_id={}", projectId, invitationId);
  }

  private ProjectInvitation findInvitationOrThrow(Project project, UUID invitationId) {
    return projectInvitationRepository
        .findByIdAndProject(invitationId, project)
        .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));
  }

  private String buildJoinUrl(String token) {
    var base =
        appPublicUrl.endsWith("/")
            ? appPublicUrl.substring(0, appPublicUrl.length() - 1)
            : appPublicUrl;
    return base + "/join/" + token;
  }

  private PendingInvitationResponse toPending(ProjectInvitation inv) {
    return new PendingInvitationResponse(
        inv.getId(), inv.getEmail(), inv.getRole(), inv.getExpiresAt(), inv.getCreatedAt());
  }

  @WithSpan("project.join")
  @Transactional
  public ProjectDetailResponse joinProject(String token, UUID userId) {
    setUuidAttribute("questify.user.id", userId);
    var invitation =
        projectInvitationRepository
            .findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid invite token"));
    if (invitation.isCancelled())
      throw new IllegalStateException("This invitation has been cancelled");
    if (invitation.isExpired()) throw new IllegalStateException("This invite link has expired");
    if (invitation.isAccepted())
      throw new IllegalStateException("This invite link has already been used");

    var project = invitation.getProject();
    if (!projectMemberRepository.existsByProjectAndUserId(project, userId)) {
      projectMemberRepository.save(
          ProjectMember.builder()
              .project(project)
              .userId(userId)
              .role(invitation.getRole())
              .build());
      log.info("User {} joined project {} as {}", userId, project.getId(), invitation.getRole());
    }

    invitation.setAcceptedByUserId(userId);
    invitation.setAcceptedAt(Instant.now());
    projectInvitationRepository.save(invitation);

    var pinned = userProjectPinRepository.existsByUserIdAndProject(userId, project);
    return toDetail(project, pinned);
  }

  @WithSpan("project.list_members")
  @Transactional(readOnly = true)
  public List<ProjectMemberResponse> listMembers(UUID projectId, UUID requesterId) {
    setUuidAttribute("questify.project.id", projectId);
    setUuidAttribute("questify.user.id", requesterId);
    var project = requireMember(projectId, requesterId);
    return projectMemberRepository.findAllByProject(project).stream()
        .map(m -> new ProjectMemberResponse(m.getUserId(), m.getRole(), m.getCreatedAt()))
        .toList();
  }

  @WithSpan("project.remove_member")
  @Transactional
  public void removeMember(UUID projectId, UUID targetUserId, UUID requesterId) {
    setUuidAttribute("questify.project.id", projectId);
    setUuidAttribute("questify.user.id", requesterId);
    var project = findProjectOrThrow(projectId);
    var requester = requireManageMembers(project, requesterId);
    if (targetUserId.equals(requesterId))
      throw new IllegalArgumentException("You cannot remove yourself from the project");

    var target = findMemberOrThrow(project, targetUserId);
    if (target.getRole() == ProjectRole.OWNER)
      throw new IllegalArgumentException("The project owner cannot be removed");
    if (requester.getRole() == ProjectRole.ADMIN && target.getRole() == ProjectRole.ADMIN)
      throw new AccessDeniedException("Admins cannot remove other admins");

    projectMemberRepository.deleteByProjectAndUserId(project, targetUserId);
    log.info("Member {} removed from project {} by {}", targetUserId, projectId, requesterId);
  }

  @WithSpan("project.change_member_role")
  @Transactional
  public ProjectDetailResponse changeMemberRole(
      UUID projectId, UUID targetUserId, ProjectRole newRole, UUID requesterId) {
    setUuidAttribute("questify.project.id", projectId);
    setUuidAttribute("questify.user.id", requesterId);
    if (newRole == ProjectRole.OWNER)
      throw new IllegalArgumentException("Ownership cannot be assigned through a role change");

    var project = findProjectOrThrow(projectId);
    var requester = requireManageMembers(project, requesterId);
    var target = findMemberOrThrow(project, targetUserId);
    if (target.getRole() == ProjectRole.OWNER)
      throw new IllegalArgumentException("The project owner's role cannot be changed");
    if (requester.getRole() == ProjectRole.ADMIN) {
      if (target.getRole() == ProjectRole.ADMIN)
        throw new AccessDeniedException("Admins cannot change another admin's role");
      if (newRole == ProjectRole.ADMIN)
        throw new AccessDeniedException("Only the owner can promote members to admin");
    }

    target.setRole(newRole);
    projectMemberRepository.save(target);
    log.info(
        "Member {} role changed to {} in project {} by {}",
        targetUserId,
        newRole,
        projectId,
        requesterId);
    var pinned = userProjectPinRepository.existsByUserIdAndProject(requesterId, project);
    return toDetail(project, pinned);
  }

  private Project findProjectOrThrow(UUID projectId) {
    return projectRepository
        .findById(projectId)
        .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
  }

  private ProjectMember findMemberOrThrow(Project project, UUID userId) {
    return projectMemberRepository
        .findByProjectAndUserId(project, userId)
        .orElseThrow(() -> new IllegalArgumentException("Member not found in this project"));
  }

  private ProjectMember requireManageMembers(Project project, UUID userId) {
    var membership =
        projectMemberRepository
            .findByProjectAndUserId(project, userId)
            .orElseThrow(() -> new AccessDeniedException("Access denied to this project"));
    if (membership.getRole() != ProjectRole.OWNER && membership.getRole() != ProjectRole.ADMIN)
      throw new AccessDeniedException("Only owners and admins can manage members");
    return membership;
  }

  private Project requireMember(UUID projectId, UUID userId) {
    var project =
        projectRepository
            .findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
    if (!projectMemberRepository.existsByProjectAndUserId(project, userId))
      throw new AccessDeniedException("Access denied to this project");
    return project;
  }

  private ProjectSummaryResponse toSummary(Project p, boolean pinned) {
    return new ProjectSummaryResponse(
        p.getId(),
        p.getName(),
        p.getDescription(),
        resolveIcon(p.getIcon()),
        pinned,
        p.getArchivedAt() != null,
        p.getUpdatedAt());
  }

  private ProjectDetailResponse toDetail(Project p, boolean pinned) {
    var members =
        projectMemberRepository.findAllByProject(p).stream()
            .map(m -> new ProjectMemberResponse(m.getUserId(), m.getRole(), m.getCreatedAt()))
            .toList();
    return new ProjectDetailResponse(
        p.getId(),
        p.getName(),
        p.getDescription(),
        resolveIcon(p.getIcon()),
        pinned,
        p.getArchivedAt(),
        p.getCreatedAt(),
        p.getUpdatedAt(),
        p.getOwnerUserId(),
        members);
  }

  private String resolveIcon(String icon) {
    return (icon == null || icon.isBlank()) ? DEFAULT_PROJECT_ICON : icon;
  }

  private String normalizeDescription(String description) {
    if (description == null) return null;
    var trimmed = description.trim();
    return trimmed.isBlank() ? null : trimmed;
  }

  private static void setProjectAttributes(Project project) {
    if (project == null) return;
    setUuidAttribute("questify.project.id", project.getId());
    setUuidAttribute("questify.project.owner_user.id", project.getOwnerUserId());
    Span.current().setAttribute("questify.project.archived", project.getArchivedAt() != null);
  }

  private static void setUuidAttribute(String key, UUID value) {
    if (value != null) Span.current().setAttribute(key, value.toString());
  }
}
