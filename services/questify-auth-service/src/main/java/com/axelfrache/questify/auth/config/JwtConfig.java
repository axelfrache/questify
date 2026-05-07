package com.axelfrache.questify.auth.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("dev")
@ConfigurationProperties(prefix = "questify.jwt")
@Slf4j
@Getter
@Setter
public class JwtConfig {

  private String secret;
  private long accessExpiration;
  private long refreshExpiration;

  @PostConstruct
  public void validate() {
    if (secret == null || secret.isBlank()) {
      throw new IllegalStateException("JWT_SECRET environment variable is required");
    }
    if (secret.getBytes().length < 32) {
      throw new IllegalStateException("JWT_SECRET must be at least 256 bits (32 bytes)");
    }
    log.info("JWT secret validation passed");
  }
}
