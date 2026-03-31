package com.axelfrache.questify.auth.security;

import com.axelfrache.questify.auth.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final JwtConfig jwtConfig;
  private final SecretKey signingKey;

  public JwtService(JwtConfig jwtConfig) {
    this.jwtConfig = jwtConfig;
    this.signingKey = Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes());
  }

  public String generateAccessToken(UserDetails userDetails) {
    var now = new Date();
    var expiry = new Date(now.getTime() + jwtConfig.getAccessExpiration());

    return Jwts.builder()
        .subject(userDetails.getUsername())
        .claim(
            "role",
            userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("User has no authority")))
        .issuedAt(now)
        .expiration(expiry)
        .signWith(signingKey)
        .compact();
  }

  public String extractUsername(String token) {
    return extractClaims(token).getSubject();
  }

  public String extractRole(String token) {
    return extractClaims(token).get("role", String.class);
  }

  public boolean isTokenExpired(String token) {
    return extractClaims(token).getExpiration().before(new Date());
  }

  public boolean isTokenValid(String token, UserDetails userDetails) {
    return extractUsername(token).equals(userDetails.getUsername()) && !isTokenExpired(token);
  }

  private Claims extractClaims(String token) {
    return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
  }
}
