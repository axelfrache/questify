package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.config.FerrisKeyConfig;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@Profile({"prod", "production"})
@RequiredArgsConstructor
@Slf4j
public class KeycloakPasswordResetProvider implements PasswordResetProvider {

  private final FerrisKeyConfig ferrisKeyConfig;
  private final KeycloakAdminClient keycloakAdminClient;
  private final RestClient restClient = RestClient.create();

  @Value("${questify.app.public-url:https://app.getquestify.com}")
  private String appPublicUrl;

  @Override
  public void requestReset(String email) {
    var issuer = trimTrailingSlash(ferrisKeyConfig.getIssuerUri());
    var adminBase = issuer.replace("/realms/", "/admin/realms/");
    var token = keycloakAdminClient.getAdminToken();

    var users =
        restClient
            .get()
            .uri(URI.create(adminBase + "/users?email=" + encode(email) + "&exact=true"))
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(UserRepresentation[].class);

    if (users == null || users.length == 0) {
      log.info("Password reset requested for unknown email={}", maskEmail(email));
      return;
    }

    var userId = users[0].id();

    restClient
        .put()
        .uri(
            URI.create(
                adminBase
                    + "/users/"
                    + userId
                    + "/execute-actions-email"
                    + "?client_id=questify-frontend"
                    + "&redirect_uri="
                    + encode(appPublicUrl)))
        .header("Authorization", "Bearer " + token)
        .contentType(MediaType.APPLICATION_JSON)
        .body(List.of("UPDATE_PASSWORD"))
        .retrieve()
        .toBodilessEntity();

    log.info("Keycloak password reset email sent for email={}", maskEmail(email));
  }

  @Override
  public void resetPassword(String tokenId, String token, String newPassword) {
    // Keycloak handles password reset via the link sent in the email — no API call needed here
    throw new UnsupportedOperationException("Password reset is handled by Keycloak");
  }

  private String trimTrailingSlash(String value) {
    return value.replaceAll("/+$", "");
  }

  private String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private String maskEmail(String email) {
    var at = email.indexOf('@');
    if (at <= 1) return "***";
    return email.charAt(0) + "***" + email.substring(at);
  }

  private record UserRepresentation(String id, String email, String username) {}
}
