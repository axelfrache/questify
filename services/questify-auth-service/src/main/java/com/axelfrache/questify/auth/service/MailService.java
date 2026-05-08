package com.axelfrache.questify.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

  private final JavaMailSender mailSender;

  @Value("${spring.mail.host:}")
  private String mailHost;

  @Value("${questify.mail.from:${spring.mail.username:no-reply@questify.local}}")
  private String from;

  public void sendPasswordResetEmail(String to, String resetUrl) {
    if (mailHost == null || mailHost.isBlank()) {
      log.info("SMTP is not configured. Password reset link for {}: {}", maskEmail(to), resetUrl);
      return;
    }

    var message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(to);
    message.setSubject("Reset your Questify password");
    message.setText(
        """
        A password reset was requested for your Questify account.

        Use this link to choose a new password:
        %s

        This link expires soon. If you did not request this, ignore this email.
        """
            .formatted(resetUrl));

    try {
      mailSender.send(message);
    } catch (MailException ex) {
      log.warn("Failed to send password reset email to {}", maskEmail(to), ex);
      throw ex;
    }
  }

  private String maskEmail(String email) {
    var at = email.indexOf('@');
    if (at <= 1) return "***";
    return email.charAt(0) + "***" + email.substring(at);
  }
}
