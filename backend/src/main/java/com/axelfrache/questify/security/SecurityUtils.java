package com.axelfrache.questify.security;

import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.UserRepository;
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
    var currentUserId = getCurrentUserId(userDetails);
    if (!currentUserId.equals(targetUserId))
      throw new AccessDeniedException("Access denied to this resource");
  }
}
