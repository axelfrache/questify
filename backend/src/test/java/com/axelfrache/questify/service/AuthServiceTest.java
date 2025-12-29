package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.axelfrache.questify.config.JwtConfig;
import com.axelfrache.questify.dto.LoginRequest;
import com.axelfrache.questify.dto.RefreshTokenRequest;
import com.axelfrache.questify.dto.RegisterRequest;
import com.axelfrache.questify.model.RefreshToken;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.RefreshTokenRepository;
import com.axelfrache.questify.repository.UserRepository;
import com.axelfrache.questify.security.JwtService;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

  private AuthService authService;
  private UserRepository userRepository;
  private RefreshTokenRepository refreshTokenRepository;
  private PasswordEncoder passwordEncoder;
  private JwtService jwtService;
  private JwtConfig jwtConfig;
  private AuthenticationManager authenticationManager;

  @BeforeEach
  void setUp() {
    userRepository = mock(UserRepository.class);
    refreshTokenRepository = mock(RefreshTokenRepository.class);
    passwordEncoder = mock(PasswordEncoder.class);
    jwtService = mock(JwtService.class);
    jwtConfig = mock(JwtConfig.class);
    authenticationManager = mock(AuthenticationManager.class);

    authService =
        new AuthService(
            userRepository,
            refreshTokenRepository,
            passwordEncoder,
            jwtService,
            jwtConfig,
            authenticationManager);

    when(jwtConfig.getRefreshExpiration()).thenReturn(604800000L);
  }

  @Test
  void register_shouldCreateUser_whenValidRequest() {
    var request = new RegisterRequest("testuser", "test@example.com", "password123");
    when(userRepository.existsByEmail(request.email())).thenReturn(false);
    when(userRepository.existsByUsername(request.username())).thenReturn(false);
    when(passwordEncoder.encode(request.password())).thenReturn("encodedPassword");
    when(jwtService.generateAccessToken(any())).thenReturn("accessToken");

    var response = authService.register(request);

    assertNotNull(response);
    assertEquals("accessToken", response.accessToken());
    assertNotNull(response.refreshToken());
    verify(userRepository).save(any(User.class));
    verify(refreshTokenRepository).save(any(RefreshToken.class));
  }

  @Test
  void register_shouldThrow_whenEmailExists() {
    var request = new RegisterRequest("testuser", "existing@example.com", "password123");
    when(userRepository.existsByEmail(request.email())).thenReturn(true);

    var exception =
        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
    assertEquals("Email already exists", exception.getMessage());
    verify(userRepository, never()).save(any());
  }

  @Test
  void register_shouldThrow_whenUsernameExists() {
    var request = new RegisterRequest("existinguser", "test@example.com", "password123");
    when(userRepository.existsByEmail(request.email())).thenReturn(false);
    when(userRepository.existsByUsername(request.username())).thenReturn(true);

    var exception =
        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
    assertEquals("Username already exists", exception.getMessage());
  }

  @Test
  void login_shouldReturnTokens_whenCredentialsValid() {
    var request = new LoginRequest("test@example.com", "password123");
    var user = createUser();

    when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
    when(jwtService.generateAccessToken(any())).thenReturn("accessToken");

    var response = authService.login(request);

    assertNotNull(response);
    assertEquals("accessToken", response.accessToken());
    assertNotNull(response.refreshToken());
    verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    verify(refreshTokenRepository).revokeAllByUser(user);
  }

  @Test
  void login_shouldThrow_whenAuthenticationFails() {
    var request = new LoginRequest("test@example.com", "wrongpassword");
    when(authenticationManager.authenticate(any()))
        .thenThrow(new BadCredentialsException("Bad credentials"));

    assertThrows(BadCredentialsException.class, () -> authService.login(request));
  }

  @Test
  void login_shouldThrow_whenUserNotFound() {
    var request = new LoginRequest("nonexistent@example.com", "password123");
    when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class, () -> authService.login(request));
  }

  @Test
  void refresh_shouldGenerateNewTokens_whenTokenValid() {
    var request = new RefreshTokenRequest("validToken");
    var user = createUser();
    var refreshToken =
        RefreshToken.builder()
            .token("validToken")
            .user(user)
            .expiryDate(Instant.now().plusSeconds(3600))
            .revoked(false)
            .build();

    when(refreshTokenRepository.findByToken(request.refreshToken()))
        .thenReturn(Optional.of(refreshToken));
    when(jwtService.generateAccessToken(any())).thenReturn("newAccessToken");

    var response = authService.refresh(request);

    assertNotNull(response);
    assertEquals("newAccessToken", response.accessToken());
    assertTrue(refreshToken.isRevoked());
    verify(refreshTokenRepository).save(refreshToken);
  }

  @Test
  void refresh_shouldThrow_whenTokenNotFound() {
    var request = new RefreshTokenRequest("invalidToken");
    when(refreshTokenRepository.findByToken(request.refreshToken())).thenReturn(Optional.empty());

    var exception =
        assertThrows(IllegalArgumentException.class, () -> authService.refresh(request));
    assertEquals("Invalid refresh token", exception.getMessage());
  }

  @Test
  void refresh_shouldThrow_whenTokenExpired() {
    var request = new RefreshTokenRequest("expiredToken");
    var user = createUser();
    var refreshToken =
        RefreshToken.builder()
            .token("expiredToken")
            .user(user)
            .expiryDate(Instant.now().minusSeconds(3600))
            .revoked(false)
            .build();

    when(refreshTokenRepository.findByToken(request.refreshToken()))
        .thenReturn(Optional.of(refreshToken));

    var exception =
        assertThrows(IllegalArgumentException.class, () -> authService.refresh(request));
    assertEquals("Refresh token is expired or revoked", exception.getMessage());
  }

  @Test
  void refresh_shouldThrow_whenTokenRevoked() {
    var request = new RefreshTokenRequest("revokedToken");
    var user = createUser();
    var refreshToken =
        RefreshToken.builder()
            .token("revokedToken")
            .user(user)
            .expiryDate(Instant.now().plusSeconds(3600))
            .revoked(true)
            .build();

    when(refreshTokenRepository.findByToken(request.refreshToken()))
        .thenReturn(Optional.of(refreshToken));

    assertThrows(IllegalArgumentException.class, () -> authService.refresh(request));
  }

  @Test
  void logout_shouldRevokeToken_whenTokenExists() {
    var request = new RefreshTokenRequest("validToken");
    var refreshToken = RefreshToken.builder().token("validToken").revoked(false).build();

    when(refreshTokenRepository.findByToken(request.refreshToken()))
        .thenReturn(Optional.of(refreshToken));

    authService.logout(request);

    assertTrue(refreshToken.isRevoked());
    verify(refreshTokenRepository).save(refreshToken);
  }

  @Test
  void logout_shouldDoNothing_whenTokenNotFound() {
    var request = new RefreshTokenRequest("nonexistentToken");
    when(refreshTokenRepository.findByToken(request.refreshToken())).thenReturn(Optional.empty());

    authService.logout(request);

    verify(refreshTokenRepository, never()).save(any());
  }

  private User createUser() {
    var user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("testuser");
    user.setEmail("test@example.com");
    user.setPassword("encodedPassword");
    return user;
  }
}
