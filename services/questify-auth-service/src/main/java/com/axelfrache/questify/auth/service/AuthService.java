package com.axelfrache.questify.auth.service;

import com.axelfrache.questify.auth.config.JwtConfig;
import com.axelfrache.questify.auth.dto.AuthResponse;
import com.axelfrache.questify.auth.dto.LoginRequest;
import com.axelfrache.questify.auth.dto.RefreshTokenRequest;
import com.axelfrache.questify.auth.dto.RegisterRequest;
import com.axelfrache.questify.auth.messaging.UserEventPublisher;
import com.axelfrache.questify.auth.messaging.UserRegisteredEvent;
import com.axelfrache.questify.auth.model.RefreshToken;
import com.axelfrache.questify.auth.model.User;
import com.axelfrache.questify.auth.repository.RefreshTokenRepository;
import com.axelfrache.questify.auth.repository.UserRepository;
import com.axelfrache.questify.auth.security.JwtService;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final JwtConfig jwtConfig;
  private final AuthenticationManager authenticationManager;
  private final UserEventPublisher userEventPublisher;

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())
        || userRepository.existsByUsername(request.username())) {
      throw new IllegalArgumentException("Email or username already in use");
    }

    var user =
        User.builder()
            .username(request.username())
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .build();

    userRepository.saveAndFlush(user);

    userEventPublisher.publishUserRegistered(
        new UserRegisteredEvent(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole().name(),
            user.getCreatedAt()));

    log.info("User registered: email={}", user.getEmail());
    return createAuthResponse(user);
  }

  @Transactional
  public AuthResponse login(LoginRequest request) {
    try {
      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.email(), request.password()));
    } catch (Exception e) {
      log.warn("Login failed: email={}", request.email());
      throw e;
    }

    var user =
        userRepository
            .findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    refreshTokenRepository.revokeAllByUser(user);

    log.info("Login successful: email={}", request.email());
    return createAuthResponse(user);
  }

  @Transactional
  public AuthResponse refresh(RefreshTokenRequest request) {
    var refreshToken =
        refreshTokenRepository
            .findByToken(request.refreshToken())
            .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

    if (!refreshToken.isValid())
      throw new IllegalArgumentException("Refresh token is expired or revoked");

    var user = refreshToken.getUser();

    refreshToken.setRevoked(true);
    refreshTokenRepository.save(refreshToken);

    return createAuthResponse(user);
  }

  @Transactional
  public void logout(RefreshTokenRequest request) {
    var refreshToken = refreshTokenRepository.findByToken(request.refreshToken());
    refreshToken.ifPresent(
        token -> {
          token.setRevoked(true);
          refreshTokenRepository.save(token);
        });
  }

  private AuthResponse createAuthResponse(User user) {
    var userDetails =
        org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password("")
            .authorities("ROLE_" + user.getRole().name())
            .build();

    var accessToken = jwtService.generateAccessToken(userDetails);
    var refreshTokenValue = UUID.randomUUID().toString();

    var refreshToken =
        RefreshToken.builder()
            .token(refreshTokenValue)
            .user(user)
            .expiryDate(Instant.now().plusMillis(jwtConfig.getRefreshExpiration()))
            .build();

    refreshTokenRepository.save(refreshToken);

    return new AuthResponse(
        accessToken,
        refreshTokenValue,
        user.getId(),
        user.getUsername(),
        user.getProfilePictureUrl(),
        user.getRole());
  }
}
