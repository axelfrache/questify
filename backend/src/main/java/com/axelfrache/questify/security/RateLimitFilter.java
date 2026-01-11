package com.axelfrache.questify.security;

import com.axelfrache.questify.config.RateLimitConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
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

  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String path = request.getRequestURI();
    String method = request.getMethod();

    if (!"POST".equalsIgnoreCase(method)) {
      filterChain.doFilter(request, response);
      return;
    }

    String clientIp = clientIpResolver.resolve(request);

    if (path.equals("/api/auth/login")) {
      if (!checkRateLimit("login:ip:" + clientIp, rateLimitConfig.getLoginIpPerMinute())) {
        sendRateLimitResponse(response, clientIp, "login");
        return;
      }

      byte[] body = request.getInputStream().readAllBytes();
      String email = extractEmailFromBody(body);

      if (email != null) {
        String emailKey = "login:email:" + clientIp + ":" + normalizeEmail(email);
        if (!checkRateLimit(emailKey, rateLimitConfig.getLoginEmailPerMinute())) {
          sendRateLimitResponse(response, clientIp, "login");
          return;
        }
      }

      filterChain.doFilter(new CachedBodyRequest(request, body), response);
      return;
    }

    if (path.equals("/api/auth/register")) {
      if (!checkRateLimit("register:ip:" + clientIp, rateLimitConfig.getRegisterIpPerMinute())) {
        sendRateLimitResponse(response, clientIp, "register");
        return;
      }
      filterChain.doFilter(request, response);
      return;
    }

    if (path.equals("/api/auth/refresh")) {
      if (!checkRateLimit("refresh:ip:" + clientIp, rateLimitConfig.getRefreshIpPerMinute())) {
        sendRateLimitResponse(response, clientIp, "refresh");
        return;
      }
      filterChain.doFilter(request, response);
      return;
    }

    filterChain.doFilter(request, response);
  }

  private boolean checkRateLimit(String key, int tokensPerMinute) {
    Bucket bucket =
        buckets.computeIfAbsent(
            key,
            k ->
                Bucket.builder()
                    .addLimit(
                        Bandwidth.builder()
                            .capacity(tokensPerMinute)
                            .refillGreedy(tokensPerMinute, Duration.ofMinutes(1))
                            .build())
                    .build());

    return bucket.tryConsume(1);
  }

  private void sendRateLimitResponse(HttpServletResponse response, String clientIp, String endpoint)
      throws IOException {
    log.warn("Rate limit exceeded for endpoint={} ip={}", endpoint, maskIp(clientIp));

    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setHeader("Retry-After", "60");

    var errorResponse = Map.of("code", "RATE_LIMITED", "message", "Too many requests");
    response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
  }

  private String extractEmailFromBody(byte[] body) {
    try {
      if (body.length == 0) {
        return null;
      }
      var jsonNode = objectMapper.readTree(body);
      if (jsonNode.has("email")) {
        return jsonNode.get("email").asText();
      }
    } catch (Exception e) {
      log.debug("Could not extract email from request body");
    }
    return null;
  }

  private String normalizeEmail(String email) {
    return email.toLowerCase().trim();
  }

  private String maskIp(String ip) {
    if (ip == null) return "unknown";
    int lastDot = ip.lastIndexOf('.');
    if (lastDot > 0) {
      return ip.substring(0, lastDot) + ".xxx";
    }
    return ip;
  }

  private static class CachedBodyRequest extends HttpServletRequestWrapper {
    private final byte[] cachedBody;

    public CachedBodyRequest(HttpServletRequest request, byte[] body) {
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

    public CachedServletInputStream(byte[] body) {
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
