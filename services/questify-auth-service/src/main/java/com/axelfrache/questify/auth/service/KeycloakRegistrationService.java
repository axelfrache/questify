package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.config.FerrisKeyConfig;
import com.axelfrache.questify.auth.dto.RegisterRequest;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@Profile({"prod", "production"})
@RequiredArgsConstructor
public class KeycloakRegistrationService {

  private final FerrisKeyConfig ferrisKeyConfig;
  private final KeycloakAdminClient keycloakAdminClient;
  private final RestClient restClient = RestClient.create();

  @WithSpan("auth.keycloak_register")
  public void register(RegisterRequest request) {
    Span.current().setAttribute("questify.auth.flow", "keycloak_register");
    var issuer = ferrisKeyConfig.getIssuerUri();
    if (issuer == null || issuer.isBlank()) {
      throw new IllegalStateException("Keycloak issuer URI is not configured");
    }

    var token = keycloakAdminClient.getAdminToken();

    try {
      restClient
          .post()
          .uri(adminUsersUri(issuer))
          .contentType(MediaType.APPLICATION_JSON)
          .header("Authorization", "Bearer " + token)
          .body(
              new KeycloakUserRepresentation(
                  request.username(),
                  request.email(),
                  request.firstName(),
                  request.lastName(),
                  true,
                  List.of(new CredentialRepresentation("password", request.password(), false))))
          .retrieve()
          .toBodilessEntity();
      Span.current().setAttribute("questify.auth.result", "success");
    } catch (RestClientResponseException ex) {
      Span.current().setAttribute("questify.auth.result", "failure");
      Span.current().setAttribute("http.response.status_code", ex.getStatusCode().value());
      if (ex.getStatusCode() == HttpStatus.CONFLICT) {
        throw new IllegalArgumentException("Email or username already in use");
      }
      if (ex.getStatusCode() == HttpStatus.FORBIDDEN) {
        throw new IllegalStateException("Keycloak registration is not allowed");
      }
      throw new IllegalStateException("Keycloak registration failed");
    }
  }

  private URI adminUsersUri(String issuer) {
    // issuer: https://auth.example.com/realms/questify
    // admin API: https://auth.example.com/admin/realms/questify/users
    var base = trimTrailingSlash(issuer).replace("/realms/", "/admin/realms/");
    return URI.create(base + "/users");
  }

  private String trimTrailingSlash(String value) {
    return value.replaceAll("/+$", "");
  }

  private record KeycloakUserRepresentation(
      String username,
      String email,
      String firstName,
      String lastName,
      boolean enabled,
      List<CredentialRepresentation> credentials) {}

  private record CredentialRepresentation(String type, String value, boolean temporary) {}
}
