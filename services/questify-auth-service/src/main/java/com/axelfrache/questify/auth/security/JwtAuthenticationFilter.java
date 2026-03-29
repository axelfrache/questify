package com.axelfrache.questify.auth.security;

import com.axelfrache.questify.auth.config.CookieConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    var path = request.getServletPath();
    return path.startsWith("/api/auth/")
        && !path.equals("/api/auth/me")
        && !path.equals("/api/auth/validate");
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    var token = extractToken(request);

    if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      try {
        var username = jwtService.extractUsername(token);
        var role = jwtService.extractRole(token);

        if (username != null && role != null && !jwtService.isTokenExpired(token)) {
          var userDetails = User.builder()
              .username(username)
              .password("")
              .authorities(List.of(new SimpleGrantedAuthority(role)))
              .build();

          var authToken = new UsernamePasswordAuthenticationToken(
              userDetails, null, userDetails.getAuthorities());
          authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
          SecurityContextHolder.getContext().setAuthentication(authToken);
        }
      } catch (Exception e) {
        log.debug("JWT validation failed: {}", e.getMessage());
      }
    }

    filterChain.doFilter(request, response);
  }

  private String extractToken(HttpServletRequest request) {
    var authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    var cookies = request.getCookies();
    if (cookies == null) return null;

    return Arrays.stream(cookies)
        .filter(c -> CookieConfig.ACCESS_TOKEN_NAME.equals(c.getName()))
        .map(Cookie::getValue)
        .filter(v -> v != null && !v.isEmpty())
        .findFirst()
        .orElse(null);
  }
}
