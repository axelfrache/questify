package com.axelfrache.questify.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class ClientIpResolver {

  private static final String X_FORWARDED_FOR = "X-Forwarded-For";
  private static final String X_REAL_IP = "X-Real-IP";

  public String resolve(HttpServletRequest request) {
    String xForwardedFor = request.getHeader(X_FORWARDED_FOR);
    if (xForwardedFor != null && !xForwardedFor.isBlank()) {
      return xForwardedFor.split(",")[0].trim();
    }

    String xRealIp = request.getHeader(X_REAL_IP);
    if (xRealIp != null && !xRealIp.isBlank()) {
      return xRealIp.trim();
    }

    return request.getRemoteAddr();
  }
}
