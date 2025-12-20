package com.axelfrache.questify.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI questifyOpenApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Questify API")
                .description("Gamified task management API")
                .version("0.0.1")
                .contact(new Contact().name("Axel Frache").url("https://github.com/axelfrache"))
                .license(new License().name("MIT")));
  }
}
