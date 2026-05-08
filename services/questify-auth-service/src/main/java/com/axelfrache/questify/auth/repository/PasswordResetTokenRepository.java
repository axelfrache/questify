package com.axelfrache.questify.auth.repository;

import com.axelfrache.questify.auth.model.PasswordResetToken;
import com.axelfrache.questify.auth.model.User;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

  Optional<PasswordResetToken> findByTokenHash(String tokenHash);

  @Modifying
  @Query(
      """
      UPDATE PasswordResetToken t
      SET t.usedAt = :usedAt
      WHERE t.user = :user AND t.usedAt IS NULL
      """)
  void markActiveTokensUsed(@Param("user") User user, @Param("usedAt") Instant usedAt);

  @Modifying
  @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :cutoff OR t.usedAt IS NOT NULL")
  void deleteExpiredOrUsed(@Param("cutoff") Instant cutoff);
}
