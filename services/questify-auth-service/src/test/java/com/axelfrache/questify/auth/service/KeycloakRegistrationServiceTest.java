package com.axelfrache.questify.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.axelfrache.questify.auth.config.FerrisKeyConfig;
import com.axelfrache.questify.auth.dto.RegisterRequest;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.util.UriComponentsBuilder;

class KeycloakRegistrationServiceTest {
  @Test
  void verificationEmailIncludesFrontendClientAndReturnDestination() throws Exception {
    var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    var base = "http://127.0.0.1:" + server.getAddress().getPort();
    var verificationQuery = new AtomicReference<String>();
    server.createContext(
        "/admin/realms/questify/users",
        exchange -> {
          exchange.getRequestBody().readAllBytes();
          if (exchange.getRequestMethod().equals("POST")) {
            exchange
                .getResponseHeaders()
                .add("Location", base + "/admin/realms/questify/users/new-user");
            exchange.sendResponseHeaders(201, -1);
          } else {
            verificationQuery.set(exchange.getRequestURI().getRawQuery());
            exchange.sendResponseHeaders(204, -1);
          }
          exchange.close();
        });
    server.start();
    try {
      var config = new FerrisKeyConfig();
      config.setIssuerUri(base + "/realms/questify");
      var admin = mock(KeycloakAdminClient.class);
      when(admin.getAdminToken()).thenReturn("test-token");
      var service = new KeycloakRegistrationService(config, admin);
      ReflectionTestUtils.setField(service, "frontendClientId", "questify-frontend");
      ReflectionTestUtils.setField(
          service, "verificationReturnUri", "https://app.getquestify.com/auth/continue");
      service.register(
          new RegisterRequest("explorer", "test@example.com", "TestPass123", "Test", "User"));
      var params =
          UriComponentsBuilder.fromUriString("https://example.com/?" + verificationQuery.get())
              .build()
              .getQueryParams();
      assertEquals("questify-frontend", params.getFirst("client_id"));
      assertEquals("https://app.getquestify.com/auth/continue", params.getFirst("redirect_uri"));
    } finally {
      server.stop(0);
    }
  }
}
