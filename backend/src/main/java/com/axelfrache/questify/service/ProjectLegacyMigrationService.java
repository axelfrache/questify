package com.axelfrache.questify.service;

import com.axelfrache.questify.model.Project;
import com.axelfrache.questify.model.ProjectMember;
import com.axelfrache.questify.model.ProjectRole;
import com.axelfrache.questify.repository.ProjectMemberRepository;
import com.axelfrache.questify.repository.ProjectRepository;
import com.axelfrache.questify.repository.QuestTemplateRepository;
import java.util.ArrayList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectLegacyMigrationService {

  private static final String DEFAULT_ICON = "📁";

  private final QuestTemplateRepository questTemplateRepository;
  private final ProjectRepository projectRepository;
  private final ProjectMemberRepository projectMemberRepository;

  @EventListener(ApplicationReadyEvent.class)
  @Transactional
  public void migrateLegacyProjectQuests() {
    var roots = questTemplateRepository.findLegacyProjectRoots();
    if (roots.isEmpty()) {
      return;
    }

    int migratedCount = 0;
    for (var root : roots) {
      var activeSubquests =
          root.getSubquests().stream().filter(subquest -> !subquest.isDeleted()).toList();
      if (activeSubquests.isEmpty()) {
        continue;
      }

      var project =
          projectRepository.save(
              Project.builder()
                  .ownerUserId(root.getUser().getId())
                  .name(root.getTitle())
                  .description(root.getDescription())
                  .icon(root.getCategory() != null ? root.getCategory().getIcon() : DEFAULT_ICON)
                  .build());

      projectMemberRepository.save(
          ProjectMember.builder()
              .project(project)
              .user(root.getUser())
              .role(ProjectRole.OWNER)
              .build());

      root.setProject(project);
      root.setActive(false);

      var detachedSubquests = new ArrayList<>(activeSubquests);
      for (var subquest : detachedSubquests) {
        subquest.setProject(project);
        subquest.setParent(null);
      }

      questTemplateRepository.save(root);
      questTemplateRepository.saveAll(detachedSubquests);
      migratedCount++;
    }

    if (migratedCount > 0) {
      log.info("Migrated {} legacy project quests to first-class projects", migratedCount);
    }
  }
}
