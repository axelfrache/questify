package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.repository.PasswordResetTokenRepository;
import com.axelfrache.questify.auth.repository.RefreshTokenRepository;
import com.axelfrache.questify.auth.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final UserRepository userRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final MailService mailService;

  @Value("${questify.app.public-url:http://localhost}")
  private String publicUrl;

  @Value("${questify.password-reset.ttl-minutes:30}")
  private long ttlMinutes;

  @Transactional
  public void requestReset(String email) {
    var normalizedEmail = email.trim();
    userRepository
        .findByEmail(normalizedEmail)
        .ifPresent(
            user -> {
              var now = Instant.now();
              passwordResetTokenRepository.markActiveTokensUsed(user, now);

              var rawToken = generateToken();
              passwordResetTokenRepository.save(
                  com.axelfrache.questify.auth.model.PasswordResetToken.builder()
                      .user(user)
                      .tokenHash(hash(rawToken))
                      .expiresAt(now.plus(Duration.ofMinutes(ttlMinutes)))
                      .build());

              mailService.sendPasswordResetEmail(user.getEmail(), resetUrl(rawToken));
            });
  }

  @Transactional
  public void resetPassword(String token, String newPassword) {
    var resetToken =
        passwordResetTokenRepository
            .findByTokenHash(hash(token))
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

    if (!resetToken.isUsable()) {
      throw new IllegalArgumentException("Invalid or expired reset token");
    }

    var user = resetToken.getUser();
    user.setPassword(passwordEncoder.encode(newPassword));
    resetToken.setUsedAt(Instant.now());
    refreshTokenRepository.revokeAllByUser(user);

    log.info("Password reset completed for userId={}", user.getId());
  }

  @Scheduled(cron = "${questify.password-reset.cleanup-cron:0 0 * * * *}")
  @Transactional
  public void cleanupTokens() {
    passwordResetTokenRepository.deleteExpiredOrUsed(Instant.now());
  }

  private String generateToken() {
    var bytes = new byte[32];
    SECURE_RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String hash(String token) {
    try {
      var digest = MessageDigest.getInstance("SHA-256");
      var hashed = digest.digest(token.getBytes(StandardCharsets.UTF_8));
      return HexFormat.toHexFormat(hashed);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to hash reset token", ex);
    }
  }

  private String resetUrl(String token) {
    return publicUrl.replaceAll("/+$", "") + "/reset-password?token=" + token;
  }

  private static final class HexFormat {
    private static final char[] HEX = "0123456789abcdef".toCharArray();

    static String toHexFormat(byte[] bytes) {
      var chars = new char[bytes.length * 2];
      for (int i = 0; i < bytes.length; i++) {
        var value = bytes[i] & 0xFF;
        chars[i * 2] = HEX[value >>> 4];
        chars[i * 2 + 1] = HEX[value & 0x0F];
      }
      return new String(chars);
    }
  }
}
