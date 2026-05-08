package com.axelfrache.questify.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile({"prod", "production"})
@ConfigurationProperties(prefix = "questify.ferriskey")
@Getter
@Setter
public class FerrisKeyConfig {

  private String issuerUri;
  private String passwordResetUri;
  private String adminTokenUri;
  private String adminClientId;
  private String adminClientSecret;
}
