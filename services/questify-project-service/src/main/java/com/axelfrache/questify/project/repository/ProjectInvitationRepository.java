package com.axelfrache.questify.project.repository;

import com.axelfrache.questify.project.model.Project;
import com.axelfrache.questify.project.model.ProjectInvitation;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

  Optional<ProjectInvitation> findByToken(String token);

  void deleteByProject(Project project);
}
