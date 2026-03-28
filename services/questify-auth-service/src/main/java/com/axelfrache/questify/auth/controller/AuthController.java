package com.axelfrache.questify.auth.controller;

import com.axelfrache.questify.auth.config.CookieConfig;
import com.axelfrache.questify.auth.config.JwtConfig;
import com.axelfrache.questify.auth.dto.AuthResponse;
import com.axelfrache.questify.auth.dto.LoginRequest;
import com.axelfrache.questify.auth.dto.RefreshTokenRequest;
import com.axelfrache.questify.auth.dto.RegisterRequest;
import com.axelfrache.questify.auth.dto.UserDto;
import com.axelfrache.questify.auth.repository.InstanceSettingsRepository;
import com.axelfrache.questify.auth.repository.UserRepository;
import com.axelfrache.questify.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final CookieConfig cookieConfig;
  private final JwtConfig jwtConfig;
  private final UserRepository userRepository;
  private final InstanceSettingsRepository instanceSettingsRepository;

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(
      @Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
    var settings =
        instanceSettingsRepository
            .findFirstByOrderByUpdatedAtDesc()
            .orElseThrow(() -> new IllegalStateException("Instance settings not initialized"));

    if (!settings.isRegistrationEnabled()) {
      return ResponseEntity.status(403).build();
    }

    var authResponse = authService.register(request);
    addAuthCookies(response, authResponse);
    return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
    var authResponse = authService.login(request);
    addAuthCookies(response, authResponse);
    return ResponseEntity.ok(authResponse);
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthResponse> refresh(
      @Valid @RequestBody RefreshTokenRequest request, HttpServletResponse response) {
    var authResponse = authService.refresh(request);
    addAuthCookies(response, authResponse);
    return ResponseEntity.ok(authResponse);
  }

  @PostMapping("/refresh-cookie")
  public ResponseEntity<AuthResponse> refreshFromCookie(
      HttpServletRequest request, HttpServletResponse response) {
    var refreshToken = extractCookieValue(request, CookieConfig.REFRESH_TOKEN_NAME);
    if (refreshToken == null) {
      return ResponseEntity.status(401).build();
    }
    var authResponse = authService.refresh(new RefreshTokenRequest(refreshToken));
    addAuthCookies(response, authResponse);
    return ResponseEntity.ok(authResponse);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
    var refreshToken = extractCookieValue(request, CookieConfig.REFRESH_TOKEN_NAME);
    if (refreshToken != null) {
      authService.logout(new RefreshTokenRequest(refreshToken));
    }
    clearAuthCookies(response);
    return ResponseEntity.ok().build();
  }

  @GetMapping("/me")
  public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
    if (userDetails == null) {
      return ResponseEntity.status(401).build();
    }
    return userRepository.findByEmail(userDetails.getUsername())
        .map(user -> ResponseEntity.ok(new UserDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getTimezone(),
            user.getProfilePictureUrl(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            user.getRole(),
            user.isEnabled())))
        .orElse(ResponseEntity.status(401).build());
  }

  private void addAuthCookies(HttpServletResponse response, AuthResponse authResponse) {
    int accessMaxAge = (int) (jwtConfig.getAccessExpiration() / 1000);
    int refreshMaxAge = (int) (jwtConfig.getRefreshExpiration() / 1000);

    response.addCookie(
        cookieConfig.createAccessTokenCookie(authResponse.accessToken(), accessMaxAge));
    response.addCookie(
        cookieConfig.createRefreshTokenCookie(authResponse.refreshToken(), refreshMaxAge));
  }

  private void clearAuthCookies(HttpServletResponse response) {
    response.addCookie(cookieConfig.createExpiredAccessTokenCookie());
    response.addCookie(cookieConfig.createExpiredRefreshTokenCookie());
  }

  private String extractCookieValue(HttpServletRequest request, String cookieName) {
    if (request.getCookies() == null) return null;
    return Arrays.stream(request.getCookies())
        .filter(c -> cookieName.equals(c.getName()))
        .map(Cookie::getValue)
        .findFirst()
        .orElse(null);
  }
}
