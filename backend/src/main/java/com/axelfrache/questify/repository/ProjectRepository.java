package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.Project;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

  @Query(
      "SELECT DISTINCT p FROM Project p "
          + "JOIN ProjectMember pm ON pm.project = p "
          + "WHERE pm.user.id = :userId")
  List<Project> findAllByMemberUserId(@Param("userId") UUID userId);

  @Query(
      "SELECT p FROM Project p "
          + "WHERE p.id = :projectId "
          + "AND EXISTS (SELECT 1 FROM ProjectMember pm WHERE pm.project = p AND pm.user.id = :userId)")
  Optional<Project> findByIdForMember(
      @Param("projectId") UUID projectId, @Param("userId") UUID userId);
}
