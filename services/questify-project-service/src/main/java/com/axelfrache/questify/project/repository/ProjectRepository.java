package com.axelfrache.questify.project.repository;

import com.axelfrache.questify.project.model.Project;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

  @Query("""
      SELECT p FROM Project p
      WHERE p.id IN (
          SELECT pm.project.id FROM ProjectMember pm WHERE pm.userId = :userId
      )
      AND (:includeArchived = true OR p.archivedAt IS NULL)
      AND (
          :search = ''
          OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
          OR (p.description IS NOT NULL AND LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
      )
      """)
  List<Project> findAllByMemberUserIdFiltered(
      @Param("userId") UUID userId,
      @Param("search") String search,
      @Param("includeArchived") boolean includeArchived);

  @Query("""
      SELECT p FROM Project p
      WHERE p.id IN (
          SELECT pm.project.id FROM ProjectMember pm WHERE pm.userId = :userId
      )
      AND p.archivedAt IS NULL
      """)
  List<Project> findAllByMemberUserId(@Param("userId") UUID userId);

  List<Project> findByOwnerUserId(UUID ownerUserId);

  void deleteByOwnerUserId(UUID ownerUserId);
}
