package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.config.FerrisKeyConfig;
import com.fasterxml.jackson.annotation.JsonProperty;
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
  public void resetPassword(String tokenId, String token, String newPassword) {
    if (tokenId == null || tokenId.isBlank()) {
      throw new UnsupportedOperationException("FerrisKey reset token_id is required");
    }

    restClient
        .post()
        .uri(resetPasswordUri())
        .contentType(MediaType.APPLICATION_JSON)
        .body(new FerrisKeyResetPasswordRequest(tokenId, token, newPassword))
        .retrieve()
        .toBodilessEntity();

    log.info("FerrisKey password reset completed with tokenId={}", tokenId);
  }

  private URI passwordResetUri() {
    var configured = ferrisKeyConfig.getPasswordResetUri();
    if (configured != null && !configured.isBlank()) {
      return URI.create(configured);
    }

    return URI.create(issuerUri() + "/login-actions/forgot-password");
  }

  private URI resetPasswordUri() {
    return URI.create(issuerUri() + "/login-actions/reset-password");
  }

  private String issuerUri() {
    var issuer = ferrisKeyConfig.getIssuerUri();
    if (issuer == null || issuer.isBlank()) {
      throw new IllegalStateException("FerrisKey issuer URI is not configured");
    }
    return trimTrailingSlash(issuer);
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

  private record FerrisKeyResetPasswordRequest(
      @JsonProperty("token_id") String tokenId,
      String token,
      @JsonProperty("new_password") String newPassword) {}
}
