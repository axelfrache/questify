package com.axelfrache.questify.config;

import com.fasterxml.jackson.databind.ObjectMapper;
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
    private int refreshIpPerMinute = 30;

    @Bean
    @ConditionalOnMissingBean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
