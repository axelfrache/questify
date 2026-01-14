package com.axelfrache.questify.security;

import com.axelfrache.questify.config.CookieConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final UserDetailsServiceImpl userDetailsService;
  private final CookieConfig cookieConfig;

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    var path = request.getServletPath();
    return path.startsWith("/api/auth/") && !path.equals("/api/auth/me");
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    var token = extractToken(request);

    if (token == null) {
      filterChain.doFilter(request, response);
      return;
    }

    try {
      var username = jwtService.extractUsername(token);

      if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        var userDetails = userDetailsService.loadUserByUsername(username);

        if (jwtService.isTokenValid(token, userDetails)) {
          var authToken =
              new UsernamePasswordAuthenticationToken(
                  userDetails, null, userDetails.getAuthorities());
          authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
          SecurityContextHolder.getContext().setAuthentication(authToken);
        }
      }
    } catch (Exception e) {
      log.debug("JWT validation failed: {}", e.getMessage());
    }

    filterChain.doFilter(request, response);
  }

  private String extractToken(HttpServletRequest request) {
    var authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    if (request.getCookies() != null) {
      return Arrays.stream(request.getCookies())
          .filter(c -> cookieConfig.getAccessTokenName().equals(c.getName()))
          .map(Cookie::getValue)
          .filter(v -> v != null && !v.isEmpty())
          .findFirst()
          .orElse(null);
    }

    return null;
  }
}
