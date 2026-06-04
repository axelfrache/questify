package com.axelfrache.questify.auth.security;

import com.axelfrache.questify.auth.repository.UserRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@Profile({"dev", "default"})
@RequiredArgsConstructor
public class DevTokenClaimsExtractor implements TokenClaimsExtractor {

  private final UserRepository userRepository;

  @Override
  public Optional<String> extractUserId(Authentication authentication) {
    return userRepository
        .findByEmail(authentication.getName())
        .filter(u -> u.isEnabled())
        .map(u -> u.getId().toString());
  }

  @Override
  public Optional<String> extractRole(Authentication authentication) {
    return userRepository
        .findByEmail(authentication.getName())
        .filter(u -> u.isEnabled())
        .map(u -> u.getRole().name());
  }
}
