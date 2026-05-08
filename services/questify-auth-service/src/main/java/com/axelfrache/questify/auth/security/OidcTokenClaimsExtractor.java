package com.axelfrache.questify.auth.security;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@Profile({"prod", "production"})
public class OidcTokenClaimsExtractor implements TokenClaimsExtractor {

  private static final List<String> KNOWN_ROLES = List.of("ADMIN", "USER");

  @Value("${questify.oidc.role-claim:roles}")
  private String roleClaim;

  @Override
  public Optional<String> extractUserId(Authentication authentication) {
    if (!(authentication instanceof JwtAuthenticationToken jwt)) return Optional.empty();
    return Optional.ofNullable(jwt.getToken().getSubject());
  }

  @Override
  @SuppressWarnings("unchecked")
  public Optional<String> extractRole(Authentication authentication) {
    if (!(authentication instanceof JwtAuthenticationToken jwt)) return Optional.empty();

    var claim = jwt.getToken().getClaims().get(roleClaim);
    return extractRoleValue(claim)
        .or(() -> extractRoleValue(jwt.getToken().getClaims().get("roles")))
        .or(() -> extractRoleValue(jwt.getToken().getClaims().get("realm_access")))
        .or(() -> Optional.of("USER"));
  }

  private Optional<String> extractRoleValue(Object claim) {
    if (claim instanceof List<?> roles) {
      return roles.stream()
          .map(Object::toString)
          .map(this::normalizeRole)
          .flatMap(Optional::stream)
          .findFirst();
    }
    if (claim instanceof String role) {
      return normalizeRole(role);
    }
    if (claim instanceof Map<?, ?> map) {
      return extractRoleValue(map.get("roles"));
    }
    return Optional.empty();
  }

  private Optional<String> normalizeRole(String role) {
    var normalized = role.toUpperCase(Locale.ROOT);
    return KNOWN_ROLES.contains(normalized) ? Optional.of(normalized) : Optional.empty();
  }
}
