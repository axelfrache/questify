package com.axelfrache.questify.project.repository;

import com.axelfrache.questify.project.model.Project;
import com.axelfrache.questify.project.model.ProjectMember;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

  Optional<ProjectMember> findByProjectAndUserId(Project project, UUID userId);

  boolean existsByProjectAndUserId(Project project, UUID userId);

  void deleteByProject(Project project);

  void deleteByProjectIn(Collection<Project> projects);

  void deleteByUserId(UUID userId);

  List<ProjectMember> findAllByProject(Project project);

  void deleteByProjectAndUserId(Project project, UUID userId);
}
