package com.axelfrache.questify.config;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class StorageConfig {

  @Value("${questify.s3.endpoint}")
  private String endpoint;

  @Value("${questify.s3.access-key}")
  private String accessKey;

  @Value("${questify.s3.secret-key}")
  private String secretKey;

  @Value("${questify.s3.region}")
  private String region;

  @Bean
  public S3Client s3Client() {
    return S3Client.builder()
        .endpointOverride(URI.create(endpoint))
        .region(Region.of(region))
        .credentialsProvider(
            StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
        .forcePathStyle(true)
        .build();
  }
}
