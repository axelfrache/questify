package com.axelfrache.questify.notification.exception;

import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.StatusCode;
import java.time.Instant;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException e) {
    return ResponseEntity.badRequest()
        .body(Map.of("error", e.getMessage(), "timestamp", Instant.now().toString()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleGeneric(Exception e) {
    log.error("Unexpected error", e);
    Span.current().recordException(e);
    Span.current().setStatus(StatusCode.ERROR);
    Span.current().setAttribute("exception.type", e.getClass().getName());
    Span.current().setAttribute("error.category", "unexpected");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("error", "Internal server error", "timestamp", Instant.now().toString()));
  }
}
