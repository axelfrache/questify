package com.axelfrache.questify.service;

import com.axelfrache.questify.dto.AuthResponse;
import com.axelfrache.questify.dto.LoginRequest;
import com.axelfrache.questify.dto.RegisterRequest;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.repository.UserRepository;
import com.axelfrache.questify.security.JwtService;
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
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
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

    var userDetails =
        org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPassword())
            .authorities("ROLE_USER")
            .build();

    var token = jwtService.generateToken(userDetails);
    return new AuthResponse(token, user.getUsername());
  }

  public AuthResponse login(LoginRequest request) {
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.email(), request.password()));

    var user =
        userRepository
            .findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    var userDetails =
        org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPassword())
            .authorities("ROLE_USER")
            .build();

    var token = jwtService.generateToken(userDetails);
    return new AuthResponse(token, user.getUsername());
  }
}
