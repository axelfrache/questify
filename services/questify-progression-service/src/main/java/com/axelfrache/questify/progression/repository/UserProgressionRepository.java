package com.axelfrache.questify.progression.repository;

import com.axelfrache.questify.progression.model.UserProgression;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProgressionRepository extends JpaRepository<UserProgression, UUID> {

  Optional<UserProgression> findByUserId(UUID userId);

  void deleteByUserId(UUID userId);
}
