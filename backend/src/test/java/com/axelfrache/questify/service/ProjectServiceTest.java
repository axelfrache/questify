package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.dto.CreateProjectRequest;
import com.axelfrache.questify.model.Project;
import com.axelfrache.questify.model.ProjectMember;
import com.axelfrache.questify.model.ProjectRole;
import com.axelfrache.questify.model.QuestTemplate;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.model.UserProjectPin;
import com.axelfrache.questify.repository.ProjectMemberRepository;
import com.axelfrache.questify.repository.ProjectRepository;
import com.axelfrache.questify.repository.QuestOccurrenceRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import com.axelfrache.questify.repository.UserProjectPinRepository;
import com.axelfrache.questify.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

class ProjectServiceTest {

  private ProjectRepository projectRepository;
  private ProjectMemberRepository projectMemberRepository;
  private UserProjectPinRepository userProjectPinRepository;
  private QuestTemplateRepository questTemplateRepository;
  private QuestOccurrenceRepository questOccurrenceRepository;
  private UserRepository userRepository;
  private ProjectService projectService;

  private UUID userId;
  private User user;

  @BeforeEach
  void setUp() {
    projectRepository = mock(ProjectRepository.class);
    projectMemberRepository = mock(ProjectMemberRepository.class);
    userProjectPinRepository = mock(UserProjectPinRepository.class);
    questTemplateRepository = mock(QuestTemplateRepository.class);
    questOccurrenceRepository = mock(QuestOccurrenceRepository.class);
    userRepository = mock(UserRepository.class);

    projectService =
        new ProjectService(
            projectRepository,
            projectMemberRepository,
            userProjectPinRepository,
            questTemplateRepository,
            questOccurrenceRepository,
            userRepository);

    userId = UUID.randomUUID();
    user = new User();
    user.setId(userId);
  }

  @Test
  void create_shouldCreateOwnerMember() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(projectRepository.save(any(Project.class)))
        .thenAnswer(
            invocation -> {
              var project = invocation.getArgument(0, Project.class);
              project.setId(UUID.randomUUID());
              project.setCreatedAt(Instant.now());
              project.setUpdatedAt(Instant.now());
              return project;
            });

    var created =
        projectService.create(userId, new CreateProjectRequest("Roadmap", "v1 launch", "🚀"));

    assertEquals("Roadmap", created.name());
    verify(projectMemberRepository).save(any());
  }

  @Test
  void getSidebar_shouldReturnPinnedAndRecentWithLimits() {
    var projects =
        java.util.stream.IntStream.range(0, 12)
            .mapToObj(
                i -> {
                  var project = new Project();
                  project.setId(UUID.randomUUID());
                  project.setName("Project " + i);
                  project.setIcon("📁");
                  project.setUpdatedAt(Instant.now().minusSeconds(i));
                  return project;
                })
            .toList();
    when(projectRepository.findAllByMemberUserId(userId)).thenReturn(projects);

    var pins =
        projects.stream()
            .limit(7)
            .map(
                project -> {
                  var pin = new UserProjectPin();
                  pin.setProject(project);
                  pin.setPinnedAt(Instant.now());
                  return pin;
                })
            .toList();
    when(userProjectPinRepository.findByUser_IdOrderByPinnedAtDesc(userId)).thenReturn(pins);

    var sidebar = projectService.getSidebar(userId);

    assertEquals(6, sidebar.pinned().size());
    assertEquals(4, sidebar.recent().size());
  }

  @Test
  void requireMember_shouldThrowForbiddenWhenNotMember() {
    var projectId = UUID.randomUUID();
    when(projectMemberRepository.existsByProject_IdAndUser_Id(projectId, userId)).thenReturn(false);

    assertThrows(
        AccessDeniedException.class, () -> projectService.requireMember(projectId, userId));
  }

  @Test
  void pin_shouldSkipWhenAlreadyPinned() {
    var projectId = UUID.randomUUID();
    var project = new Project();
    project.setId(projectId);

    when(projectMemberRepository.existsByProject_IdAndUser_Id(projectId, userId)).thenReturn(true);
    when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
    when(userProjectPinRepository.existsByUser_IdAndProject_Id(userId, projectId)).thenReturn(true);

    projectService.pin(projectId, userId);

    verify(userProjectPinRepository, never()).save(any());
  }

  @Test
  void delete_shouldClearProjectLinksAndDeleteProject_whenRequesterIsOwner() {
    var projectId = UUID.randomUUID();
    var project = new Project();
    project.setId(projectId);
    var rootQuest = new QuestTemplate();
    rootQuest.setId(UUID.randomUUID());
    rootQuest.setUser(user);
    rootQuest.setSubquests(new java.util.ArrayList<>());

    var subquest = new QuestTemplate();
    subquest.setId(UUID.randomUUID());
    subquest.setUser(user);
    subquest.setParent(rootQuest);
    rootQuest.getSubquests().add(subquest);

    var previouslyDeletedQuest = new QuestTemplate();
    previouslyDeletedQuest.setId(UUID.randomUUID());
    previouslyDeletedQuest.setDeleted(true);
    previouslyDeletedQuest.setProject(project);

    var membership = new ProjectMember();
    membership.setProject(project);
    membership.setUser(user);
    membership.setRole(ProjectRole.OWNER);

    when(projectMemberRepository.findByProject_IdAndUser_Id(projectId, userId))
        .thenReturn(Optional.of(membership));
    when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
    when(questTemplateRepository.findByProject_Id(projectId))
        .thenReturn(List.of(rootQuest, subquest, previouslyDeletedQuest));

    projectService.delete(projectId, userId);

    verify(questTemplateRepository).clearProjectByProjectId(projectId);
    verify(userProjectPinRepository).deleteByProject_Id(projectId);
    verify(projectMemberRepository).deleteByProject_Id(projectId);
    verify(projectRepository).deleteById(projectId);
    assertTrue(rootQuest.isDeleted());
    assertTrue(subquest.isDeleted());
  }
}
