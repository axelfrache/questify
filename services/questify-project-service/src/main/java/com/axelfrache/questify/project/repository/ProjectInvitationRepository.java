package com.axelfrache.questify.project.repository;

import com.axelfrache.questify.project.model.Project;
import com.axelfrache.questify.project.model.ProjectInvitation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

  Optional<ProjectInvitation> findByToken(String token);

  Optional<ProjectInvitation> findByIdAndProject(UUID id, Project project);

  List<ProjectInvitation> findByProjectAndAcceptedAtIsNullAndCancelledAtIsNullOrderByCreatedAtDesc(
      Project project);

  void deleteByProject(Project project);
}
