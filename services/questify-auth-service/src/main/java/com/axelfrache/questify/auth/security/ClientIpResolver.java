package com.axelfrache.questify.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ClientIpResolver {

  private static final String X_FORWARDED_FOR = "X-Forwarded-For";
  private static final String X_REAL_IP = "X-Real-IP";

  public String resolve(HttpServletRequest request) {
    var xForwardedFor = request.getHeader(X_FORWARDED_FOR);
    if (StringUtils.hasText(xForwardedFor)) {
      return xForwardedFor.split(",")[0].trim();
    }

    var xRealIp = request.getHeader(X_REAL_IP);
    if (StringUtils.hasText(xRealIp)) {
      return xRealIp.trim();
    }

    return request.getRemoteAddr();
  }
}
