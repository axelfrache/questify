package com.axelfrache.questify.auth.security;

import com.axelfrache.questify.auth.model.Role;
import com.axelfrache.questify.auth.model.User;
import com.axelfrache.questify.auth.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

  private final UserRepository userRepository;

  public User getCurrentUser(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new AccessDeniedException("User not authenticated");
    }

    return findUser(authentication).orElseThrow(() -> new AccessDeniedException("User not found"));
  }

  public UUID getCurrentUserId(Authentication authentication) {
    return getCurrentUser(authentication).getId();
  }

  public void validateOwnership(Authentication authentication, UUID targetUserId) {
    var currentUser = getCurrentUser(authentication);
    if (!currentUser.getId().equals(targetUserId) && currentUser.getRole() != Role.ADMIN) {
      throw new AccessDeniedException("Access denied to this resource");
    }
  }

  private Optional<User> findUser(Authentication authentication) {
    if (authentication.getPrincipal() instanceof UserDetails userDetails) {
      return userRepository.findByEmail(userDetails.getUsername());
    }

    if (authentication instanceof JwtAuthenticationToken jwt) {
      var subject = jwt.getToken().getSubject();
      var byId = parseUuid(subject).flatMap(userRepository::findById);
      if (byId.isPresent()) return byId;

      var email = jwt.getToken().getClaimAsString("email");
      if (email != null && !email.isBlank()) {
        return userRepository.findByEmail(email);
      }
    }

    return Optional.empty();
  }

  private Optional<UUID> parseUuid(String value) {
    try {
      return Optional.of(UUID.fromString(value));
    } catch (IllegalArgumentException | NullPointerException ignored) {
      return Optional.empty();
    }
  }
}
