package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.UserProjectPin;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProjectPinRepository extends JpaRepository<UserProjectPin, UUID> {

  List<UserProjectPin> findByUser_IdOrderByPinnedAtDesc(UUID userId);

  Optional<UserProjectPin> findByUser_IdAndProject_Id(UUID userId, UUID projectId);

  boolean existsByUser_IdAndProject_Id(UUID userId, UUID projectId);

  void deleteByUser_IdAndProject_Id(UUID userId, UUID projectId);

  void deleteByProject_Id(UUID projectId);
}
