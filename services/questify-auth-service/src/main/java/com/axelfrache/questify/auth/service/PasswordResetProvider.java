package com.axelfrache.questify.auth.service;

public interface PasswordResetProvider {

  void requestReset(String email);

  void resetPassword(String tokenId, String token, String newPassword);
}
