package com.axelfrache.questify.config;

import jakarta.servlet.http.Cookie;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
@Setter
public class CookieConfig {

  private static final String ACCESS_TOKEN_NAME = "access_token";
  private static final String REFRESH_TOKEN_NAME = "refresh_token";

  @Value("${questify.cookie.secure:true}")
  private boolean secure;

  @Value("${questify.cookie.same-site:Lax}")
  private String sameSite;

  @Value("${questify.cookie.path:/api}")
  private String path;

  public Cookie createAccessTokenCookie(String token, int maxAgeSeconds) {
    return createCookie(ACCESS_TOKEN_NAME, token, maxAgeSeconds);
  }

  public Cookie createRefreshTokenCookie(String token, int maxAgeSeconds) {
    return createCookie(REFRESH_TOKEN_NAME, token, maxAgeSeconds);
  }

  public Cookie createExpiredAccessTokenCookie() {
    return createCookie(ACCESS_TOKEN_NAME, "", 0);
  }

  public Cookie createExpiredRefreshTokenCookie() {
    return createCookie(REFRESH_TOKEN_NAME, "", 0);
  }

  private Cookie createCookie(String name, String value, int maxAgeSeconds) {
    var cookie = new Cookie(name, value);
    cookie.setHttpOnly(true);
    cookie.setSecure(secure);
    cookie.setPath(path);
    cookie.setMaxAge(maxAgeSeconds);
    cookie.setAttribute("SameSite", sameSite);
    return cookie;
  }

  public String getAccessTokenName() {
    return ACCESS_TOKEN_NAME;
  }

  public String getRefreshTokenName() {
    return REFRESH_TOKEN_NAME;
  }
}
