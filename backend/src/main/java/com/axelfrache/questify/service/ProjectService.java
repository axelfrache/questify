package com.axelfrache.questify.service;

import com.axelfrache.questify.dto.*;
import com.axelfrache.questify.model.*;
import com.axelfrache.questify.repository.ProjectMemberRepository;
import com.axelfrache.questify.repository.ProjectRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserProjectPinRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectService {

  private static final int SIDEBAR_PINNED_LIMIT = 6;
  private static final int SIDEBAR_RECENT_LIMIT = 4;
  private static final String DEFAULT_PROJECT_ICON = "📁";

  private final ProjectRepository projectRepository;
  private final ProjectMemberRepository projectMemberRepository;
  private final UserProjectPinRepository userProjectPinRepository;
  private final QuestTemplateRepository questTemplateRepository;
  private final QuestOccurrenceRepository questOccurrenceRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public ProjectSidebarResponse getSidebar(UUID userId) {
    var projects =
        projectRepository.findAllByMemberUserId(userId).stream()
            .filter(project -> project.getArchivedAt() == null)
            .toList();
    var projectById = new HashMap<UUID, Project>();
    projects.forEach(project -> projectById.put(project.getId(), project));

    var pinned =
        userProjectPinRepository.findByUser_IdOrderByPinnedAtDesc(userId).stream()
            .map(pin -> projectById.get(pin.getProject().getId()))
            .filter(Objects::nonNull)
            .limit(SIDEBAR_PINNED_LIMIT)
            .map(project -> toSummary(project, true))
            .toList();

    var pinnedIds =
        pinned.stream()
            .map(ProjectSummaryResponse::id)
            .collect(java.util.stream.Collectors.toSet());
    var recent =
        projects.stream()
            .filter(project -> !pinnedIds.contains(project.getId()))
            .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
            .limit(SIDEBAR_RECENT_LIMIT)
            .map(project -> toSummary(project, false))
            .toList();

    return new ProjectSidebarResponse(pinned, recent);
  }

  @Transactional(readOnly = true)
  public List<ProjectSummaryResponse> list(
      UUID userId, String search, String sort, boolean includeArchived) {
    var pinnedIds =
        userProjectPinRepository.findByUser_IdOrderByPinnedAtDesc(userId).stream()
            .map(pin -> pin.getProject().getId())
            .collect(java.util.stream.Collectors.toSet());

    var normalizedSearch = search != null ? search.trim().toLowerCase() : "";
    var projects =
        projectRepository.findAllByMemberUserId(userId).stream()
            .filter(project -> includeArchived || project.getArchivedAt() == null)
            .filter(project -> matchesSearch(project, normalizedSearch))
            .toList();

    java.util.Comparator<Project> comparator =
        "name".equalsIgnoreCase(sort)
            ? java.util.Comparator.comparing(project -> project.getName().toLowerCase())
            : (a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt());

    return projects.stream()
        .sorted(comparator)
        .map(project -> toSummary(project, pinnedIds.contains(project.getId())))
        .toList();
  }

  @Transactional
  public ProjectDetailResponse create(UUID userId, CreateProjectRequest request) {
    var user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

    var project =
        projectRepository.save(
            Project.builder()
                .ownerUserId(userId)
                .name(request.name().trim())
                .description(normalizeDescription(request.description()))
                .icon(resolveIcon(request.icon()))
                .build());

    projectMemberRepository.save(
        ProjectMember.builder().project(project).user(user).role(ProjectRole.OWNER).build());

    return toDetail(project, false);
  }

  @Transactional(readOnly = true)
  public ProjectDetailResponse findById(UUID projectId, UUID userId) {
    var project = requireMember(projectId, userId);
    var pinned = userProjectPinRepository.existsByUser_IdAndProject_Id(userId, projectId);
    return toDetail(project, pinned);
  }

  @Transactional
  public ProjectDetailResponse update(UUID projectId, UUID userId, UpdateProjectRequest request) {
    var project = requireMember(projectId, userId);

    if (request.name() != null) {
      var trimmedName = request.name().trim();
      if (trimmedName.isBlank()) {
        throw new IllegalArgumentException("Project name cannot be blank");
      }
      project.setName(trimmedName);
    }
    if (request.description() != null) {
      project.setDescription(normalizeDescription(request.description()));
    }
    if (request.icon() != null) {
      project.setIcon(resolveIcon(request.icon()));
    }
    if (request.archived() != null) {
      project.setArchivedAt(request.archived() ? Instant.now() : null);
    }

    projectRepository.save(project);
    var pinned = userProjectPinRepository.existsByUser_IdAndProject_Id(userId, projectId);
    return toDetail(project, pinned);
  }

  @Transactional
  public void pin(UUID projectId, UUID userId) {
    var project = requireMember(projectId, userId);
    if (project.getArchivedAt() != null) {
      throw new IllegalStateException("Archived projects cannot be pinned");
    }
    if (userProjectPinRepository.existsByUser_IdAndProject_Id(userId, projectId)) {
      return;
    }

    var user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

    userProjectPinRepository.save(UserProjectPin.builder().user(user).project(project).build());
  }

  @Transactional
  public void unpin(UUID projectId, UUID userId) {
    requireMember(projectId, userId);
    userProjectPinRepository.deleteByUser_IdAndProject_Id(userId, projectId);
  }

  @Transactional
  public void delete(UUID projectId, UUID userId) {
    var membership =
        projectMemberRepository
            .findByProject_IdAndUser_Id(projectId, userId)
            .orElseThrow(() -> new AccessDeniedException("Access denied to this project"));

    if (membership.getRole() != ProjectRole.OWNER) {
      throw new AccessDeniedException("Only the project owner can delete this project");
    }

    projectRepository
        .findById(projectId)
        .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

    var projectTemplates = questTemplateRepository.findByProject_Id(projectId);
    var deletedTemplateIds = new HashSet<UUID>();

    projectTemplates.stream()
        .filter(template -> !template.isDeleted())
        .forEach(template -> deleteTemplate(template, deletedTemplateIds));

    questTemplateRepository.clearProjectByProjectId(projectId);
    userProjectPinRepository.deleteByProject_Id(projectId);
    projectMemberRepository.deleteByProject_Id(projectId);
    projectRepository.deleteById(projectId);
  }

  private void deleteTemplate(QuestTemplate template, Set<UUID> deletedTemplateIds) {
    if (!deletedTemplateIds.add(template.getId())) {
      return;
    }

    if (template.getSubquests() != null) {
      for (var subquest : template.getSubquests()) {
        if (!subquest.isDeleted()) {
          deleteTemplate(subquest, deletedTemplateIds);
        }
      }
    }

    if (template.getOccurrences() != null && !template.getOccurrences().isEmpty()) {
      var occurrences = new java.util.ArrayList<>(template.getOccurrences());
      template.getOccurrences().clear();
      questOccurrenceRepository.deleteAll(occurrences);
    }

    template.setDeleted(true);
    template.setActive(false);
    template.setProject(null);
  }

  @Transactional(readOnly = true)
  public Project requireMember(UUID projectId, UUID userId) {
    if (!projectMemberRepository.existsByProject_IdAndUser_Id(projectId, userId)) {
      throw new AccessDeniedException("Access denied to this project");
    }

    return projectRepository
        .findById(projectId)
        .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
  }

  private ProjectSummaryResponse toSummary(Project project, boolean pinned) {
    return new ProjectSummaryResponse(
        project.getId(),
        project.getName(),
        project.getDescription(),
        resolveIcon(project.getIcon()),
        pinned,
        project.getArchivedAt() != null,
        project.getUpdatedAt());
  }

  private ProjectDetailResponse toDetail(Project project, boolean pinned) {
    return new ProjectDetailResponse(
        project.getId(),
        project.getName(),
        project.getDescription(),
        resolveIcon(project.getIcon()),
        pinned,
        project.getArchivedAt(),
        project.getCreatedAt(),
        project.getUpdatedAt());
  }

  private String resolveIcon(String icon) {
    if (icon == null || icon.isBlank()) {
      return DEFAULT_PROJECT_ICON;
    }
    return icon;
  }

  private String normalizeDescription(String description) {
    if (description == null) {
      return null;
    }

    var trimmed = description.trim();
    return trimmed.isBlank() ? null : trimmed;
  }

  private boolean matchesSearch(Project project, String normalizedSearch) {
    if (normalizedSearch.isBlank()) {
      return true;
    }

    if (project.getName().toLowerCase().contains(normalizedSearch)) {
      return true;
    }

    var description = project.getDescription();
    return description != null && description.toLowerCase().contains(normalizedSearch);
  }
}
