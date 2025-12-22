package com.axelfrache.questify.service;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class StorageService {

  private static final Set<String> ALLOWED_CONTENT_TYPES =
      Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

  private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  private final S3Client s3Client;

  @Value("${questify.s3.bucket}")
  private String bucket;

  @Value("${questify.s3.public-url}")
  private String publicUrl;

  public String uploadProfilePicture(UUID userId, MultipartFile file) {
    validateFile(file);

    var extension = getFileExtension(file.getOriginalFilename());
    var key = "profiles/" + userId + "/" + UUID.randomUUID() + extension;

    try {
      var putRequest =
          PutObjectRequest.builder()
              .bucket(bucket)
              .key(key)
              .contentType(file.getContentType())
              .build();

      s3Client.putObject(putRequest, RequestBody.fromBytes(file.getBytes()));

      return publicUrl + "/" + bucket + "/" + key;
    } catch (IOException e) {
      throw new IllegalStateException("Failed to upload file", e);
    }
  }

  public void deleteFile(String fileUrl) {
    if (fileUrl == null || fileUrl.isBlank()) {
      return;
    }

    var key = extractKeyFromUrl(fileUrl);
    if (key != null) {
      var deleteRequest = DeleteObjectRequest.builder().bucket(bucket).key(key).build();

      s3Client.deleteObject(deleteRequest);
    }
  }

  private void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("File is required");
    }

    if (file.getSize() > MAX_FILE_SIZE) {
      throw new IllegalArgumentException("File size exceeds maximum allowed size of 5MB");
    }

    var contentType = file.getContentType();
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
      throw new IllegalArgumentException("Invalid file type. Allowed types: JPEG, PNG, WebP, GIF");
    }
  }

  private String getFileExtension(String filename) {
    if (filename == null || !filename.contains(".")) {
      return "";
    }
    return filename.substring(filename.lastIndexOf("."));
  }

  private String extractKeyFromUrl(String url) {
    var bucketPath = "/" + bucket + "/";
    var index = url.indexOf(bucketPath);
    if (index == -1) {
      return null;
    }
    return url.substring(index + bucketPath.length());
  }
}
