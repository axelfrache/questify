package com.axelfrache.questify.service;

import com.axelfrache.questify.config.JwtConfig;
import com.axelfrache.questify.dto.AuthResponse;
import com.axelfrache.questify.dto.LoginRequest;
import com.axelfrache.questify.dto.RefreshTokenRequest;
import com.axelfrache.questify.dto.RegisterRequest;
import com.axelfrache.questify.model.RefreshToken;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.RefreshTokenRepository;
import com.axelfrache.questify.repository.UserRepository;
import com.axelfrache.questify.security.JwtService;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final JwtConfig jwtConfig;
  private final AuthenticationManager authenticationManager;

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new IllegalArgumentException("Email already exists");
    }
    if (userRepository.existsByUsername(request.username())) {
      throw new IllegalArgumentException("Username already exists");
    }

    var user =
        User.builder()
            .username(request.username())
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .build();

    userRepository.save(user);

    return createAuthResponse(user);
  }

  @Transactional
  public AuthResponse login(LoginRequest request) {
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.email(), request.password()));

    var user =
        userRepository
            .findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    refreshTokenRepository.revokeAllByUser(user);

    return createAuthResponse(user);
  }

  @Transactional
  public AuthResponse refresh(RefreshTokenRequest request) {
    var refreshToken =
        refreshTokenRepository
            .findByToken(request.refreshToken())
            .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

    if (!refreshToken.isValid()) {
      throw new IllegalArgumentException("Refresh token is expired or revoked");
    }

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
            .password(user.getPassword())
            .authorities("ROLE_USER")
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
        user.getProfilePictureUrl());
  }
}
