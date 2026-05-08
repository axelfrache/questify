package com.axelfrache.questify.auth.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "questify.ratelimit")
@Getter
@Setter
public class RateLimitConfig {

  private int loginIpPerMinute = 10;
  private int loginEmailPerMinute = 5;
  private int registerIpPerMinute = 3;
  private int registerEmailPerMinute = 2;
  private int refreshIpPerMinute = 30;
  private int passwordResetIpPerMinute = 3;
  private int passwordResetEmailPerMinute = 2;

  @Bean
  @ConditionalOnMissingBean
  public ObjectMapper objectMapper() {
    return JsonMapper.builder()
        .findAndAddModules()
        .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        .build();
  }
}
