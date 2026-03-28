package com.axelfrache.questify.quest.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class HeaderAuthenticationFilter extends OncePerRequestFilter {

  static final String USER_ID_HEADER = "X-User-Id";
  static final String USER_ROLE_HEADER = "X-User-Role";

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    var userId = request.getHeader(USER_ID_HEADER);
    var userRole = request.getHeader(USER_ROLE_HEADER);

    if (StringUtils.hasText(userId) && SecurityContextHolder.getContext().getAuthentication() == null) {
      var role = StringUtils.hasText(userRole) ? userRole : "ROLE_USER";
      var auth = new UsernamePasswordAuthenticationToken(
          userId, null, List.of(new SimpleGrantedAuthority(role)));
      SecurityContextHolder.getContext().setAuthentication(auth);
    }

    filterChain.doFilter(request, response);
  }
}
