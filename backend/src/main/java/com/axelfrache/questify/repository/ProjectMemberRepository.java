package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.ProjectMember;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

  boolean existsByProject_IdAndUser_Id(UUID projectId, UUID userId);

  Optional<ProjectMember> findByProject_IdAndUser_Id(UUID projectId, UUID userId);

  void deleteByProject_Id(UUID projectId);
}
