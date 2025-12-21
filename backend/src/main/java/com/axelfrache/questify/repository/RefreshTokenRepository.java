package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.RefreshToken;
import com.axelfrache.questify.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

  Optional<RefreshToken> findByToken(String token);

  @Modifying
  @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user = :user")
  void revokeAllByUser(User user);

  void deleteByUser(User user);
}
