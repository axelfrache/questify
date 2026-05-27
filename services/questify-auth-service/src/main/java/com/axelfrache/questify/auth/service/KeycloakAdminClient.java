package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.config.FerrisKeyConfig;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

@Service
@Profile({"prod", "production"})
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminClient {

  private final FerrisKeyConfig ferrisKeyConfig;
  private final RestClient restClient = RestClient.create();

  private final AtomicReference<CachedToken> tokenCache = new AtomicReference<>();

  public String getAdminToken() {
    var cached = tokenCache.get();
    if (cached != null && cached.isValid()) {
      return cached.token();
    }
    return refreshToken();
  }

  private synchronized String refreshToken() {
    var cached = tokenCache.get();
    if (cached != null && cached.isValid()) {
      return cached.token();
    }

    var form = new LinkedMultiValueMap<String, String>();
    form.add("grant_type", "client_credentials");
    form.add("client_id", ferrisKeyConfig.getAdminClientId());
    form.add("client_secret", ferrisKeyConfig.getAdminClientSecret());

    var response =
        restClient
            .post()
            .uri(ferrisKeyConfig.getAdminTokenUri())
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(TokenResponse.class);

    if (response == null) {
      throw new IllegalStateException("Keycloak admin token response is null");
    }

    var expiresAt = Instant.now().plusSeconds(response.expiresIn());
    var newToken = new CachedToken(response.accessToken(), expiresAt);
    tokenCache.set(newToken);

    log.debug("Keycloak admin token refreshed, expires at {}", expiresAt);
    return newToken.token();
  }

  private record TokenResponse(
      @JsonProperty("access_token") String accessToken,
      @JsonProperty("expires_in") long expiresIn) {}

  private record CachedToken(String token, Instant expiresAt) {
    boolean isValid() {
      return Instant.now().isBefore(expiresAt.minusSeconds(30));
    }
  }
}
