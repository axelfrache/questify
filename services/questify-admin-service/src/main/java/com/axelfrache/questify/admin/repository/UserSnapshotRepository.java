package com.axelfrache.questify.admin.repository;

import com.axelfrache.questify.admin.model.UserSnapshot;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSnapshotRepository extends JpaRepository<UserSnapshot, UUID> {

  Page<UserSnapshot> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
      String username, String email, Pageable pageable);
}
