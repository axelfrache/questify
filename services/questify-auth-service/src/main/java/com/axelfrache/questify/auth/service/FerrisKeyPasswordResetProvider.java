package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.config.FerrisKeyConfig;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

@Service
@Profile({"prod", "production"})
@RequiredArgsConstructor
@Slf4j
public class FerrisKeyPasswordResetProvider implements PasswordResetProvider {

  private final FerrisKeyConfig ferrisKeyConfig;
  private final RestClient restClient = RestClient.create();

  @Value("${questify.app.public-url:https://app.getquestify.com}")
  private String publicUrl;

  @Override
  public void requestReset(String email) {
    var resetUri = ferrisKeyConfig.getPasswordResetUri();
    if (resetUri == null || resetUri.isBlank()) {
      throw new IllegalStateException("FerrisKey password reset URI is not configured");
    }

    var requestSpec =
        restClient
            .post()
            .uri(URI.create(resetUri))
            .contentType(MediaType.APPLICATION_JSON)
            .body(new FerrisKeyPasswordResetRequest(email.trim(), loginRedirectUri()));

    var adminToken = getAdminAccessToken();
    if (adminToken != null) {
      requestSpec.header("Authorization", "Bearer " + adminToken);
    }

    requestSpec.retrieve().toBodilessEntity();
    log.info("FerrisKey password reset requested for email={}", maskEmail(email));
  }

  @Override
  public void resetPassword(String token, String newPassword) {
    throw new UnsupportedOperationException("Password reset confirmation is handled by FerrisKey");
  }

  private String getAdminAccessToken() {
    var clientId = ferrisKeyConfig.getAdminClientId();
    var clientSecret = ferrisKeyConfig.getAdminClientSecret();
    if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
      return null;
    }

    var form = new LinkedMultiValueMap<String, String>();
    form.add("grant_type", "client_credentials");
    form.add("client_id", clientId);
    form.add("client_secret", clientSecret);

    var response =
        restClient
            .post()
            .uri(tokenUri())
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(FerrisKeyTokenResponse.class);

    if (response == null || response.accessToken() == null || response.accessToken().isBlank()) {
      throw new IllegalStateException("FerrisKey admin token response is missing access_token");
    }
    return response.accessToken();
  }

  private URI tokenUri() {
    var configured = ferrisKeyConfig.getAdminTokenUri();
    if (configured != null && !configured.isBlank()) {
      return URI.create(configured);
    }

    var issuer = ferrisKeyConfig.getIssuerUri();
    if (issuer == null || issuer.isBlank()) {
      throw new IllegalStateException("FerrisKey issuer URI is not configured");
    }
    return URI.create(trimTrailingSlash(issuer) + "/protocol/openid-connect/token");
  }

  private String loginRedirectUri() {
    return trimTrailingSlash(publicUrl) + "/login";
  }

  private String trimTrailingSlash(String value) {
    return value.replaceAll("/+$", "");
  }

  private String maskEmail(String email) {
    var at = email.indexOf('@');
    if (at <= 1) return "***";
    return email.charAt(0) + "***" + email.substring(at);
  }

  private record FerrisKeyPasswordResetRequest(String email, String redirectUri) {}

  private record FerrisKeyTokenResponse(
      @com.fasterxml.jackson.annotation.JsonProperty("access_token") String accessToken) {}
}
