package com.axelfrache.questify.auth.controller;

import com.axelfrache.questify.auth.dto.UserDto;
import com.axelfrache.questify.auth.model.Role;
import com.axelfrache.questify.auth.model.User;
import com.axelfrache.questify.auth.repository.UserRepository;
import com.axelfrache.questify.auth.security.TokenClaimsExtractor;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final UserRepository userRepository;
  private final TokenClaimsExtractor tokenClaimsExtractor;
  private final PasswordEncoder passwordEncoder;

  @Value("${questify.oidc.allow-admin-provisioning:false}")
  private boolean allowAdminProvisioning;

  @GetMapping("/validate")
  public ResponseEntity<Void> validate(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    var user = findOrProvisionUser(authentication);
    if (user.getId() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok()
        .header("X-User-Id", user.getId().toString())
        .header("X-User-Role", user.getRole().name())
        .build();
  }

  @GetMapping("/me")
  public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(401).build();
    }
    return ResponseEntity.ok(toUserDto(findOrProvisionUser(authentication)));
  }

  private User findOrProvisionUser(Authentication authentication) {
    var email = extractEmail(authentication);
    if (email == null || email.isBlank()) {
      throw new org.springframework.security.access.AccessDeniedException("Email claim is missing");
    }

    var user = userRepository.findByEmail(email).orElseGet(() -> createUser(authentication, email));
    if (!user.isEnabled()) {
      throw new org.springframework.security.access.AccessDeniedException("User is disabled");
    }
    return user;
  }

  private User createUser(Authentication authentication, String email) {
    var username = uniqueUsername(extractUsername(authentication, email));
    var role = provisionedRole(authentication);

    var user =
        User.builder()
            .username(username)
            .email(email)
            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
            .role(role)
            .isEnabled(true)
            .build();

    try {
      return userRepository.saveAndFlush(user);
    } catch (DataIntegrityViolationException ex) {
      return userRepository.findByEmail(email).orElseThrow(() -> ex);
    }
  }

  private UserDto toUserDto(User user) {
    return new UserDto(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getTimezone(),
        user.getBio(),
        user.getProfilePictureUrl(),
        user.getCreatedAt(),
        user.getUpdatedAt(),
        user.getRole(),
        user.isEnabled());
  }

  private Role provisionedRole(Authentication authentication) {
    var extractedRole =
        Role.valueOf(tokenClaimsExtractor.extractRole(authentication).orElse("USER"));
    if (extractedRole == Role.ADMIN && !allowAdminProvisioning) {
      return Role.USER;
    }
    return extractedRole;
  }

  private String extractEmail(Authentication authentication) {
    if (authentication instanceof JwtAuthenticationToken jwt) {
      return jwt.getToken().getClaimAsString("email");
    }
    return authentication.getName();
  }

  private String extractUsername(Authentication authentication, String email) {
    if (authentication instanceof JwtAuthenticationToken jwt) {
      var claims = jwt.getToken().getClaims();
      var preferredUsername = stringClaim(claims, "preferred_username");
      if (preferredUsername != null
          && !preferredUsername.isBlank()
          && !preferredUsername.equals(email)) {
        return preferredUsername;
      }
      var givenName = stringClaim(claims, "given_name");
      if (givenName != null && !givenName.isBlank()) return givenName;
      var name = stringClaim(claims, "name");
      if (name != null && !name.isBlank()) return name;
    }
    return email.substring(0, email.indexOf('@'));
  }

  private String stringClaim(Map<String, Object> claims, String name) {
    var value = claims.get(name);
    return value == null ? null : value.toString();
  }

  private String uniqueUsername(String candidate) {
    var base = candidate.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "-");
    if (base.length() < 3) base = "user-" + base;
    if (base.length() > 45) base = base.substring(0, 45);

    var username = base;
    var suffix = 1;
    while (userRepository.existsByUsername(username)) {
      username = "%s-%d".formatted(base, suffix++);
    }
    return username;
  }

}
