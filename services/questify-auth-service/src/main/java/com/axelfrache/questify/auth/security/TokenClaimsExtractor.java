package com.axelfrache.questify.auth.security;

import java.util.Optional;
import org.springframework.security.core.Authentication;

public interface TokenClaimsExtractor {

  Optional<String> extractUserId(Authentication authentication);

  Optional<String> extractRole(Authentication authentication);
}
