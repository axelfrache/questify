package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.User;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

  Optional<User> findByUsername(String username);

  Optional<User> findByEmail(String email);

  boolean existsByUsername(String username);

  boolean existsByEmail(String email);

  Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
      String username, String email, org.springframework.data.domain.Pageable pageable);
}
