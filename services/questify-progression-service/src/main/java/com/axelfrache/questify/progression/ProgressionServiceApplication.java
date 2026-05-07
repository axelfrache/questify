package com.axelfrache.questify.progression;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ProgressionServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(ProgressionServiceApplication.class, args);
  }
}
