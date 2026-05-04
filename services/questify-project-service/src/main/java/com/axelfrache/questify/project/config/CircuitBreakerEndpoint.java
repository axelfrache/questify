package com.axelfrache.questify.project.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.stereotype.Component;

@Component
@Endpoint(id = "circuitbreaker")
@RequiredArgsConstructor
public class CircuitBreakerEndpoint {

  private final CircuitBreaker rabbitMqCircuitBreaker;

  @ReadOperation
  public Map<String, Object> circuitBreaker() {
    var metrics = rabbitMqCircuitBreaker.getMetrics();
    return Map.of(
        "name", "rabbitmq",
        "state", rabbitMqCircuitBreaker.getState().name(),
        "failureRate", metrics.getFailureRate() + "%",
        "bufferedCalls", metrics.getNumberOfBufferedCalls(),
        "failedCalls", metrics.getNumberOfFailedCalls(),
        "successfulCalls", metrics.getNumberOfSuccessfulCalls());
  }
}
