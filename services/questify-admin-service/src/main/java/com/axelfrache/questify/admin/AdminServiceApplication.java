package com.axelfrache.questify.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AdminServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(AdminServiceApplication.class, args);
  }
}
