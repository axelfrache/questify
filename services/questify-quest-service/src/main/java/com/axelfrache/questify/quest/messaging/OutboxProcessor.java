package com.axelfrache.questify.quest.messaging;

import com.axelfrache.questify.quest.model.OutboxEvent;
import com.axelfrache.questify.quest.model.OutboxStatus;
import com.axelfrache.questify.quest.repository.OutboxEventRepository;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.propagation.TextMapGetter;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxProcessor {

  private static final TextMapGetter<Map<String, String>> MAP_GETTER =
      new TextMapGetter<>() {
        @Override
        public Iterable<String> keys(Map<String, String> c) {
          return c.keySet();
        }

        @Override
        public String get(Map<String, String> c, String k) {
          return c.get(k);
        }
      };

  private final OutboxEventRepository outboxEventRepository;
  private final RabbitTemplate rabbitTemplate;
  private final CircuitBreaker rabbitMqCircuitBreaker;

  @Value("${outbox.processor.max-attempts:10}")
  private int maxAttempts;

  @Value("${outbox.publisher-confirm-timeout-ms:5000}")
  private long publisherConfirmTimeoutMs;

  @Scheduled(fixedDelayString = "${outbox.processor.fixed-delay-ms:5000}")
  @Transactional
  @WithSpan("outbox.process")
  public void process() {
    var pending = outboxEventRepository.findPendingBatchForUpdate();
    Span.current().setAttribute("outbox.pending_count", pending.size());
    if (pending.isEmpty()) return;

    for (OutboxEvent event : pending) {
      setOutboxAttributes(event);
      var eventContext = extractEventContext(event);
      try {
        rabbitMqCircuitBreaker.executeCallable(
            () -> {
              try (var ignored = eventContext.makeCurrent()) {
                send(event);
              }
              return null;
            });
        event.setStatus(OutboxStatus.SENT);
        event.setProcessedAt(Instant.now());
        event.setNextAttemptAt(null);
        event.setLastError(null);
        setOutboxAttributes(event);
        log.debug("Outbox event sent: id={} routingKey={}", event.getId(), event.getRoutingKey());
      } catch (CallNotPermittedException ex) {
        Span.current().recordException(ex);
        Span.current().setStatus(StatusCode.ERROR);
        Span.current().setAttribute("error.category", "circuit_open");
        log.warn("Circuit OPEN — outbox processing paused");
        break;
      } catch (Exception ex) {
        scheduleRetry(event, ex);
        setOutboxAttributes(event);
        Span.current().recordException(ex);
        Span.current().setStatus(StatusCode.ERROR);
        Span.current().setAttribute("error.category", "outbox_publish_failed");
        log.warn("Failed to send outbox event: id={} — {}", event.getId(), errorMessage(ex));
      }
    }
  }

  private Context extractEventContext(OutboxEvent event) {
    if (event.getTraceparent() == null) return Context.current();
    return GlobalOpenTelemetry.getPropagators()
        .getTextMapPropagator()
        .extract(Context.current(), Map.of("traceparent", event.getTraceparent()), MAP_GETTER);
  }

  @WithSpan("outbox.send")
  private void send(OutboxEvent event) throws Exception {
    setOutboxAttributes(event);
    Message message =
        MessageBuilder.withBody(event.getPayload().getBytes(StandardCharsets.UTF_8))
            .setContentType(MessageProperties.CONTENT_TYPE_JSON)
            .setHeader("__TypeId__", event.getTypeId())
            .build();
    var correlationData = new CorrelationData(event.getId().toString());
    rabbitTemplate.send(QueueConstants.EXCHANGE, event.getRoutingKey(), message, correlationData);

    var confirm = correlationData.getFuture().get(publisherConfirmTimeoutMs, TimeUnit.MILLISECONDS);
    if (!confirm.isAck()) {
      throw new IllegalStateException("RabbitMQ publisher confirm nack: " + confirm.getReason());
    }
    var returned = correlationData.getReturned();
    if (returned != null) {
      throw new IllegalStateException("RabbitMQ returned message: " + returned.getReplyText());
    }
  }

  private void scheduleRetry(OutboxEvent event, Exception ex) {
    var attempts = event.getAttempts() + 1;
    event.setAttempts(attempts);
    event.setLastError(truncate(errorMessage(ex)));

    if (attempts >= maxAttempts) {
      event.setStatus(OutboxStatus.DEAD);
      event.setProcessedAt(Instant.now());
      return;
    }

    event.setStatus(OutboxStatus.PENDING);
    event.setNextAttemptAt(Instant.now().plus(backoff(attempts)));
  }

  private Duration backoff(int attempts) {
    return Duration.ofSeconds(Math.min(300, 5L * attempts));
  }

  private String truncate(String value) {
    if (value == null || value.length() <= 1000) return value;
    return value.substring(0, 1000);
  }

  private String errorMessage(Exception ex) {
    var message = ex.getMessage();
    return message == null || message.isBlank() ? ex.toString() : message;
  }

  private static void setOutboxAttributes(OutboxEvent event) {
    if (event == null) return;
    if (event.getId() != null)
      Span.current().setAttribute("outbox.event_id", event.getId().toString());
    if (event.getTypeId() != null)
      Span.current().setAttribute("outbox.event_type", event.getTypeId());
    if (event.getRoutingKey() != null)
      Span.current().setAttribute("messaging.destination", event.getRoutingKey());
    if (event.getStatus() != null)
      Span.current().setAttribute("outbox.status", event.getStatus().name());
    Span.current().setAttribute("outbox.retry_count", event.getAttempts());
  }
}
