package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.config.FerrisKeyConfig;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@Profile({"prod", "production"})
@RequiredArgsConstructor
@Slf4j
public class FerrisKeyPasswordResetProvider implements PasswordResetProvider {

  private final FerrisKeyConfig ferrisKeyConfig;
  private final RestClient restClient = RestClient.create();

  @Override
  public void requestReset(String email) {
    restClient
        .post()
        .uri(passwordResetUri())
        .contentType(MediaType.APPLICATION_JSON)
        .body(new FerrisKeyPasswordResetRequest(email.trim()))
        .retrieve()
        .toBodilessEntity();
    log.info("FerrisKey password reset requested for email={}", maskEmail(email));
  }

  @Override
  public void resetPassword(String token, String newPassword) {
    throw new UnsupportedOperationException("Password reset confirmation is handled by FerrisKey");
  }

  private URI passwordResetUri() {
    var configured = ferrisKeyConfig.getPasswordResetUri();
    if (configured != null && !configured.isBlank()) {
      return URI.create(configured);
    }

    var issuer = ferrisKeyConfig.getIssuerUri();
    if (issuer == null || issuer.isBlank()) {
      throw new IllegalStateException("FerrisKey issuer URI is not configured");
    }
    return URI.create(trimTrailingSlash(issuer) + "/login-actions/forgot-password");
  }

  private String trimTrailingSlash(String value) {
    return value.replaceAll("/+$", "");
  }

  private String maskEmail(String email) {
    var at = email.indexOf('@');
    if (at <= 1) return "***";
    return email.charAt(0) + "***" + email.substring(at);
  }

  private record FerrisKeyPasswordResetRequest(String email) {}
}
