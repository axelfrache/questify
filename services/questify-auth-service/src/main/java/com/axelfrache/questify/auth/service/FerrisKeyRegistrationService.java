package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.config.FerrisKeyConfig;
import com.axelfrache.questify.auth.dto.RegisterRequest;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@Profile("prod")
@RequiredArgsConstructor
public class FerrisKeyRegistrationService {

  private final FerrisKeyConfig ferrisKeyConfig;
  private final RestClient restClient = RestClient.create();

  public void register(RegisterRequest request) {
    var issuer = ferrisKeyConfig.getIssuerUri();
    if (issuer == null || issuer.isBlank()) {
      throw new IllegalStateException("FerrisKey issuer URI is not configured");
    }

    try {
      restClient
          .post()
          .uri(registrationUri(issuer))
          .body(
              new FerrisKeyRegistrationRequest(
                  request.email(), request.email(), request.username(), null, request.password()))
          .retrieve()
          .toBodilessEntity();
    } catch (RestClientResponseException ex) {
      if (ex.getStatusCode() == HttpStatus.BAD_REQUEST
          || ex.getStatusCode() == HttpStatus.CONFLICT
          || ex.getStatusCode() == HttpStatus.INTERNAL_SERVER_ERROR) {
        throw new IllegalArgumentException("Email or username already in use");
      }
      if (ex.getStatusCode() == HttpStatus.FORBIDDEN) {
        throw new IllegalStateException("FerrisKey self-service registration is disabled");
      }
      throw new IllegalStateException("FerrisKey registration failed");
    }
  }

  private URI registrationUri(String issuer) {
    return URI.create(trimTrailingSlash(issuer) + "/protocol/openid-connect/registrations");
  }

  private String trimTrailingSlash(String value) {
    return value.replaceAll("/+$", "");
  }

  private record FerrisKeyRegistrationRequest(
      String username, String email, String first_name, String last_name, String password) {}
}
