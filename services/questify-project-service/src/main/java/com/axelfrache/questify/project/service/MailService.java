package com.axelfrache.questify.project.service;

import com.axelfrache.questify.project.model.ProjectRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

  private final ObjectProvider<JavaMailSender> mailSenderProvider;

  @Value("${spring.mail.host:}")
  private String mailHost;

  @Value("${questify.mail.from:${spring.mail.username:no-reply@questify.local}}")
  private String from;

  public void sendProjectInvitationEmail(
      String to, String projectName, ProjectRole role, String joinUrl) {
    var mailSender = mailSenderProvider.getIfAvailable();
    if (mailSender == null || mailHost == null || mailHost.isBlank()) {
      log.info(
          "SMTP is not configured. Invitation to {} for project \"{}\" as {}: {}",
          maskEmail(to),
          projectName,
          role,
          joinUrl);
      return;
    }

    var message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(to);
    message.setSubject("You're invited to \"" + projectName + "\" on Questify");
    message.setText(
        """
        You've been invited to collaborate on the project "%s" as %s.

        Open this link to join:
        %s

        This invitation expires soon. If you weren't expecting it, you can ignore this email.
        """
            .formatted(projectName, role.name().toLowerCase(), joinUrl));

    try {
      mailSender.send(message);
    } catch (MailException ex) {
      log.warn("Failed to send project invitation email to {}", maskEmail(to), ex);
      throw ex;
    }
  }

  private String maskEmail(String email) {
    var at = email.indexOf('@');
    if (at <= 1) return "***";
    return email.charAt(0) + "***" + email.substring(at);
  }
}
