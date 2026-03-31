package com.axelfrache.questify.project.repository;

import com.axelfrache.questify.project.model.Project;
import com.axelfrache.questify.project.model.UserProjectPin;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProjectPinRepository extends JpaRepository<UserProjectPin, UUID> {

  @Query(
      "SELECT pin.project.id FROM UserProjectPin pin WHERE pin.userId = :userId ORDER BY pin.pinnedAt DESC")
  List<UUID> findPinnedProjectIdsByUserIdOrderByPinnedAtDesc(@Param("userId") UUID userId);

  boolean existsByUserIdAndProject(UUID userId, Project project);

  void deleteByUserIdAndProject(UUID userId, Project project);

  void deleteByProject(Project project);

  void deleteByProjectIn(Collection<Project> projects);

  void deleteByUserId(UUID userId);
}
