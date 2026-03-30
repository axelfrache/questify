package com.axelfrache.questify.auth.security;

import com.axelfrache.questify.auth.model.Role;
import com.axelfrache.questify.auth.model.User;
import com.axelfrache.questify.auth.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

  private final UserRepository userRepository;

  public User getCurrentUser(UserDetails userDetails) {
    return userRepository
        .findByEmail(userDetails.getUsername())
        .orElseThrow(() -> new AccessDeniedException("User not found"));
  }

  public UUID getCurrentUserId(UserDetails userDetails) {
    return getCurrentUser(userDetails).getId();
  }

  public void validateOwnership(UserDetails userDetails, UUID targetUserId) {
    var currentUser = getCurrentUser(userDetails);
    if (!currentUser.getId().equals(targetUserId) && currentUser.getRole() != Role.ADMIN) {
      throw new AccessDeniedException("Access denied to this resource");
    }
  }
}
