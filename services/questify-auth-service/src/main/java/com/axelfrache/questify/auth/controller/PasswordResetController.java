package com.axelfrache.questify.auth.controller;

import com.axelfrache.questify.auth.dto.ForgotPasswordRequest;
import com.axelfrache.questify.auth.dto.ResetPasswordRequest;
import com.axelfrache.questify.auth.service.PasswordResetProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class PasswordResetController {

  private final PasswordResetProvider passwordResetProvider;

  @PostMapping("/forgot-password")
  public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    passwordResetProvider.requestReset(request.email());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/reset-password")
  public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    try {
      passwordResetProvider.resetPassword(request.token(), request.newPassword());
      return ResponseEntity.noContent().build();
    } catch (UnsupportedOperationException ex) {
      return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }
  }
}
