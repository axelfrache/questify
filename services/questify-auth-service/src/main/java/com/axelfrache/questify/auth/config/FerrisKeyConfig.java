package com.axelfrache.questify.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("prod")
@ConfigurationProperties(prefix = "questify.ferriskey")
@Getter
@Setter
public class FerrisKeyConfig {

  private String issuerUri;
}
