package com.axelfrache.questify.security;

import com.axelfrache.questify.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {

  private final JwtConfig jwtConfig;

  public String generateAccessToken(UserDetails userDetails) {
    return generateToken(userDetails, jwtConfig.getAccessExpiration());
  }

  public String generateRefreshToken(UserDetails userDetails) {
    return generateToken(userDetails, jwtConfig.getRefreshExpiration());
  }

  private String generateToken(UserDetails userDetails, long expiration) {
    var now = new Date();
    var expiry = new Date(now.getTime() + expiration);

    return Jwts.builder()
        .subject(userDetails.getUsername())
        .issuedAt(now)
        .expiration(expiry)
        .signWith(getSigningKey())
        .compact();
  }

  public String extractUsername(String token) {
    return extractClaims(token).getSubject();
  }

  public boolean isTokenValid(String token, UserDetails userDetails) {
    var username = extractUsername(token);
    return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
  }

  private boolean isTokenExpired(String token) {
    return extractClaims(token).getExpiration().before(new Date());
  }

  private Claims extractClaims(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
  }

  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes());
  }
}
