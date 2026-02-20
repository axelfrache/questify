package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.InstanceSettings;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface InstanceSettingsRepository extends JpaRepository<InstanceSettings, UUID> {

  @Query("SELECT s FROM InstanceSettings s ORDER BY s.updatedAt DESC LIMIT 1")
  Optional<InstanceSettings> findFirstByOrderByUpdatedAtDesc();
}
