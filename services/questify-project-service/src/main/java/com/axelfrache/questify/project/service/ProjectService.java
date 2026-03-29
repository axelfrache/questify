package com.axelfrache.questify.project.service;

import com.axelfrache.questify.project.dto.CreateProjectRequest;
import com.axelfrache.questify.project.dto.ProjectDetailResponse;
import com.axelfrache.questify.project.dto.ProjectSidebarResponse;
import com.axelfrache.questify.project.dto.ProjectSummaryResponse;
import com.axelfrache.questify.project.dto.UpdateProjectRequest;
import com.axelfrache.questify.project.messaging.ProjectEventPublisher;
import com.axelfrache.questify.project.model.Project;
import com.axelfrache.questify.project.model.ProjectMember;
import com.axelfrache.questify.project.model.ProjectRole;
import com.axelfrache.questify.project.model.UserProjectPin;
import com.axelfrache.questify.project.repository.ProjectMemberRepository;
import com.axelfrache.questify.project.repository.ProjectRepository;
import com.axelfrache.questify.project.repository.UserProjectPinRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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

  private final ProjectRepository projectRepository;
  private final ProjectMemberRepository projectMemberRepository;
  private final UserProjectPinRepository userProjectPinRepository;
  private final ProjectEventPublisher projectEventPublisher;

  @Transactional(readOnly = true)
  public ProjectSidebarResponse getSidebar(UUID userId) {
    var projects = projectRepository.findAllByMemberUserId(userId);
    var projectById = projects.stream().collect(Collectors.toMap(Project::getId, p -> p));

    var pinned = userProjectPinRepository.findPinnedProjectIdsByUserIdOrderByPinnedAtDesc(userId).stream()
        .map(projectById::get)
        .filter(Objects::nonNull)
        .limit(SIDEBAR_PINNED_LIMIT)
        .map(p -> toSummary(p, true))
        .toList();

    var pinnedIds = pinned.stream().map(ProjectSummaryResponse::id).collect(Collectors.toSet());

    var recent = projects.stream()
        .filter(p -> !pinnedIds.contains(p.getId()))
        .sorted(Comparator.comparing(Project::getUpdatedAt).reversed())
        .limit(SIDEBAR_RECENT_LIMIT)
        .map(p -> toSummary(p, false))
        .toList();

    return new ProjectSidebarResponse(pinned, recent);
  }

  @Transactional(readOnly = true)
  public Page<ProjectSummaryResponse> list(
      UUID userId, String search, String sort, boolean includeArchived, int page, int size) {
    var pinnedIds = new HashSet<>(userProjectPinRepository.findPinnedProjectIdsByUserIdOrderByPinnedAtDesc(userId));
    var normalizedSearch = search != null ? search.trim().toLowerCase() : "";

    Comparator<Project> comparator = "name".equalsIgnoreCase(sort)
        ? Comparator.comparing(p -> p.getName().toLowerCase())
        : Comparator.comparing(Project::getUpdatedAt).reversed();

    var sorted = projectRepository.findAllByMemberUserIdFiltered(userId, normalizedSearch, includeArchived)
        .stream()
        .sorted(comparator)
        .toList();

    var pageable = PageRequest.of(page, size);
    int start = (int) pageable.getOffset();
    int end = Math.min(start + pageable.getPageSize(), sorted.size());
    List<ProjectSummaryResponse> content = sorted.subList(start, end).stream()
        .map(p -> toSummary(p, pinnedIds.contains(p.getId())))
        .toList();

    return new PageImpl<>(content, pageable, sorted.size());
  }

  @Transactional
  public ProjectDetailResponse create(UUID userId, CreateProjectRequest request) {
    var project = projectRepository.save(
        Project.builder()
            .ownerUserId(userId)
            .name(request.name().trim())
            .description(normalizeDescription(request.description()))
            .icon(resolveIcon(request.icon()))
            .build());

    projectMemberRepository.save(
        ProjectMember.builder()
            .project(project)
            .userId(userId)
            .role(ProjectRole.OWNER)
            .build());

    return toDetail(project, false);
  }

  @Transactional(readOnly = true)
  public ProjectDetailResponse findById(UUID projectId, UUID userId) {
    var project = requireMember(projectId, userId);
    var pinned = userProjectPinRepository.existsByUserIdAndProject(userId, project);
    return toDetail(project, pinned);
  }

  @Transactional
  public ProjectDetailResponse update(UUID projectId, UUID userId, UpdateProjectRequest request) {
    var project = requireMember(projectId, userId);

    if (request.name() != null) {
      var trimmedName = request.name().trim();
      if (trimmedName.isBlank()) throw new IllegalArgumentException("Project name cannot be blank");
      project.setName(trimmedName);
    }
    if (request.description() != null)
      project.setDescription(normalizeDescription(request.description()));
    if (request.icon() != null)
      project.setIcon(resolveIcon(request.icon()));
    if (request.archived() != null)
      project.setArchivedAt(request.archived() ? Instant.now() : null);

    projectRepository.save(project);
    var pinned = userProjectPinRepository.existsByUserIdAndProject(userId, project);
    return toDetail(project, pinned);
  }

  @Transactional
  public void pin(UUID projectId, UUID userId) {
    var project = requireMember(projectId, userId);
    if (project.getArchivedAt() != null)
      throw new IllegalStateException("Archived projects cannot be pinned");
    try {
      userProjectPinRepository.save(UserProjectPin.builder().userId(userId).project(project).build());
    } catch (DataIntegrityViolationException ignored) {
    }
  }

  @Transactional
  public void unpin(UUID projectId, UUID userId) {
    var project = requireMember(projectId, userId);
    userProjectPinRepository.deleteByUserIdAndProject(userId, project);
  }

  @Transactional
  public void delete(UUID projectId, UUID userId) {
    var projectOpt = projectRepository.findById(projectId);
    if (projectOpt.isEmpty()) return;

    var project = projectOpt.get();
    var membership = projectMemberRepository.findByProjectAndUserId(project, userId)
        .orElseThrow(() -> new AccessDeniedException("Access denied to this project"));

    if (membership.getRole() != ProjectRole.OWNER)
      throw new AccessDeniedException("Only the project owner can delete this project");

    userProjectPinRepository.deleteByProject(project);
    projectMemberRepository.deleteByProject(project);
    projectRepository.delete(project);

    projectEventPublisher.publishProjectDeleted(projectId);
  }

  private Project requireMember(UUID projectId, UUID userId) {
    var project = projectRepository.findById(projectId)
        .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
    if (!projectMemberRepository.existsByProjectAndUserId(project, userId))
      throw new AccessDeniedException("Access denied to this project");
    return project;
  }

  private ProjectSummaryResponse toSummary(Project p, boolean pinned) {
    return new ProjectSummaryResponse(
        p.getId(), p.getName(), p.getDescription(),
        resolveIcon(p.getIcon()), pinned, p.getArchivedAt() != null, p.getUpdatedAt());
  }

  private ProjectDetailResponse toDetail(Project p, boolean pinned) {
    return new ProjectDetailResponse(
        p.getId(), p.getName(), p.getDescription(),
        resolveIcon(p.getIcon()), pinned, p.getArchivedAt(), p.getCreatedAt(), p.getUpdatedAt());
  }

  private String resolveIcon(String icon) {
    return (icon == null || icon.isBlank()) ? DEFAULT_PROJECT_ICON : icon;
  }

  private String normalizeDescription(String description) {
    if (description == null) return null;
    var trimmed = description.trim();
    return trimmed.isBlank() ? null : trimmed;
  }
}
