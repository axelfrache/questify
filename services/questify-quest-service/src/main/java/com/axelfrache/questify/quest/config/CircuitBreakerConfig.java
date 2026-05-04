package com.axelfrache.questify.quest.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig.SlidingWindowType;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CircuitBreakerConfig {

  @Value("${circuit-breaker.sliding-window-size:10}")
  private int slidingWindowSize;

  @Value("${circuit-breaker.minimum-number-of-calls:5}")
  private int minimumNumberOfCalls;

  @Value("${circuit-breaker.failure-rate-threshold:50.0}")
  private float failureRateThreshold;

  @Value("${circuit-breaker.wait-duration-in-open-state-seconds:30}")
  private int waitDurationInOpenStateSeconds;

  @Value("${circuit-breaker.permitted-calls-in-half-open:3}")
  private int permittedCallsInHalfOpen;

  @Bean
  public CircuitBreakerRegistry circuitBreakerRegistry() {
    var config =
        io.github.resilience4j.circuitbreaker.CircuitBreakerConfig.custom()
            .slidingWindowType(SlidingWindowType.COUNT_BASED)
            .slidingWindowSize(slidingWindowSize)
            .minimumNumberOfCalls(minimumNumberOfCalls)
            .failureRateThreshold(failureRateThreshold)
            .waitDurationInOpenState(Duration.ofSeconds(waitDurationInOpenStateSeconds))
            .permittedNumberOfCallsInHalfOpenState(permittedCallsInHalfOpen)
            .build();
    return CircuitBreakerRegistry.of(config);
  }

  @Bean
  public CircuitBreaker rabbitMqCircuitBreaker(CircuitBreakerRegistry registry) {
    return registry.circuitBreaker("rabbitmq");
  }
}
