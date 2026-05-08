package com.axelfrache.questify.auth.security;

import com.axelfrache.questify.auth.config.RateLimitConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

  private final RateLimitConfig rateLimitConfig;
  private final ClientIpResolver clientIpResolver;
  private final ObjectMapper objectMapper;

  private record BucketEntry(Bucket bucket, long lastAccessMs) {}

  private final Map<String, BucketEntry> buckets = new ConcurrentHashMap<>();
  private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

  @PostConstruct
  void startCleanup() {
    scheduler.scheduleAtFixedRate(this::evictStaleBuckets, 1, 1, TimeUnit.HOURS);
  }

  @PreDestroy
  void stopCleanup() {
    scheduler.shutdownNow();
  }

  private void evictStaleBuckets() {
    var cutoff = System.currentTimeMillis() - Duration.ofHours(1).toMillis();
    buckets.entrySet().removeIf(e -> e.getValue().lastAccessMs() < cutoff);
    log.debug("Rate limit bucket cleanup: {} entries remaining", buckets.size());
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    if (!"POST".equalsIgnoreCase(request.getMethod())) {
      filterChain.doFilter(request, response);
      return;
    }

    var path = request.getRequestURI();
    var clientIp = clientIpResolver.resolve(request);

    switch (path) {
      case "/api/auth/login" -> {
        if (!checkRateLimit("login:ip:" + clientIp, rateLimitConfig.getLoginIpPerMinute())) {
          sendRateLimitResponse(response, clientIp, "login");
          return;
        }
        var body = request.getInputStream().readAllBytes();
        var email = extractEmailFromBody(body);
        if (email != null) {
          var normalizedEmail = email.toLowerCase().trim();
          if (!checkRateLimit(
              "login:email:" + clientIp + ":" + normalizedEmail,
              rateLimitConfig.getLoginEmailPerMinute())) {
            sendRateLimitResponse(response, clientIp, "login");
            return;
          }
        }
        filterChain.doFilter(new CachedBodyRequest(request, body), response);
        return;
      }
      case "/api/auth/register" -> {
        if (!checkRateLimit("register:ip:" + clientIp, rateLimitConfig.getRegisterIpPerMinute())) {
          sendRateLimitResponse(response, clientIp, "register");
          return;
        }
        var body = request.getInputStream().readAllBytes();
        var email = extractEmailFromBody(body);
        if (email != null) {
          var normalizedEmail = email.toLowerCase().trim();
          if (!checkRateLimit(
              "register:email:" + clientIp + ":" + normalizedEmail,
              rateLimitConfig.getRegisterEmailPerMinute())) {
            sendRateLimitResponse(response, clientIp, "register");
            return;
          }
        }
        filterChain.doFilter(new CachedBodyRequest(request, body), response);
        return;
      }
      case "/api/auth/forgot-password" -> {
        if (!checkRateLimit(
            "password-reset:ip:" + clientIp, rateLimitConfig.getPasswordResetIpPerMinute())) {
          sendRateLimitResponse(response, clientIp, "password-reset");
          return;
        }
        var body = request.getInputStream().readAllBytes();
        var email = extractEmailFromBody(body);
        if (email != null) {
          var normalizedEmail = email.toLowerCase().trim();
          if (!checkRateLimit(
              "password-reset:email:" + clientIp + ":" + normalizedEmail,
              rateLimitConfig.getPasswordResetEmailPerMinute())) {
            sendRateLimitResponse(response, clientIp, "password-reset");
            return;
          }
        }
        filterChain.doFilter(new CachedBodyRequest(request, body), response);
        return;
      }
      case "/api/auth/refresh" -> {
        if (!checkRateLimit("refresh:ip:" + clientIp, rateLimitConfig.getRefreshIpPerMinute())) {
          sendRateLimitResponse(response, clientIp, "refresh");
          return;
        }
      }
    }

    filterChain.doFilter(request, response);
  }

  private boolean checkRateLimit(String key, int tokensPerMinute) {
    var now = System.currentTimeMillis();
    var entry =
        buckets.compute(
            key,
            (k, existing) ->
                existing != null
                    ? new BucketEntry(existing.bucket(), now)
                    : new BucketEntry(
                        Bucket.builder()
                            .addLimit(
                                Bandwidth.builder()
                                    .capacity(tokensPerMinute)
                                    .refillGreedy(tokensPerMinute, Duration.ofMinutes(1))
                                    .build())
                            .build(),
                        now));
    return entry.bucket().tryConsume(1);
  }

  private void sendRateLimitResponse(HttpServletResponse response, String clientIp, String endpoint)
      throws IOException {
    log.warn("Rate limit exceeded for endpoint={} ip={}", endpoint, maskIp(clientIp));
    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setHeader("Retry-After", "60");
    response
        .getWriter()
        .write(
            objectMapper.writeValueAsString(
                Map.of("code", "RATE_LIMITED", "message", "Too many requests")));
  }

  private String extractEmailFromBody(byte[] body) {
    try {
      if (body.length == 0) return null;
      var jsonNode = objectMapper.readTree(body);
      return jsonNode.has("email") ? jsonNode.get("email").asText() : null;
    } catch (Exception e) {
      log.debug("Could not extract email from request body");
      return null;
    }
  }

  private String maskIp(String ip) {
    if (ip == null) return "unknown";
    var lastDot = ip.lastIndexOf('.');
    return lastDot > 0 ? ip.substring(0, lastDot) + ".xxx" : ip;
  }

  private static class CachedBodyRequest extends HttpServletRequestWrapper {
    private final byte[] cachedBody;

    CachedBodyRequest(HttpServletRequest request, byte[] body) {
      super(request);
      this.cachedBody = body;
    }

    @Override
    public ServletInputStream getInputStream() {
      return new CachedServletInputStream(cachedBody);
    }

    @Override
    public BufferedReader getReader() {
      return new BufferedReader(new InputStreamReader(new ByteArrayInputStream(cachedBody)));
    }
  }

  private static class CachedServletInputStream extends ServletInputStream {
    private final ByteArrayInputStream inputStream;

    CachedServletInputStream(byte[] body) {
      this.inputStream = new ByteArrayInputStream(body);
    }

    @Override
    public int read() {
      return inputStream.read();
    }

    @Override
    public boolean isFinished() {
      return inputStream.available() == 0;
    }

    @Override
    public boolean isReady() {
      return true;
    }

    @Override
    public void setReadListener(ReadListener listener) {
      throw new UnsupportedOperationException();
    }
  }
}
