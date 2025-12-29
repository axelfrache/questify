package com.axelfrache.questify.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

class StorageServiceTest {

  private StorageService storageService;
  private S3Client s3Client;

  @BeforeEach
  void setUp() {
    s3Client = mock(S3Client.class);
    storageService = new StorageService(s3Client);

    ReflectionTestUtils.setField(storageService, "bucket", "test-bucket");
    ReflectionTestUtils.setField(storageService, "publicUrl", "https://s3.example.com");
  }

  @Test
  void uploadProfilePicture_shouldUploadAndReturnUrl() throws IOException {
    var userId = UUID.randomUUID();
    var file = mock(MultipartFile.class);
    when(file.isEmpty()).thenReturn(false);
    when(file.getSize()).thenReturn(1024L);
    when(file.getContentType()).thenReturn("image/jpeg");
    when(file.getOriginalFilename()).thenReturn("profile.jpg");
    when(file.getBytes()).thenReturn(new byte[1024]);
    when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
        .thenReturn(PutObjectResponse.builder().build());

    var url = storageService.uploadProfilePicture(userId, file);

    assertNotNull(url);
    assertTrue(url.startsWith("https://s3.example.com/test-bucket/profiles/"));
    assertTrue(url.endsWith(".jpg"));
    verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
  }

  @Test
  void uploadProfilePicture_shouldThrow_whenFileEmpty() {
    var userId = UUID.randomUUID();
    var file = mock(MultipartFile.class);
    when(file.isEmpty()).thenReturn(true);

    var exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> storageService.uploadProfilePicture(userId, file));
    assertEquals("File is required", exception.getMessage());
  }

  @Test
  void uploadProfilePicture_shouldThrow_whenFileNull() {
    var userId = UUID.randomUUID();

    assertThrows(
        IllegalArgumentException.class, () -> storageService.uploadProfilePicture(userId, null));
  }

  @Test
  void uploadProfilePicture_shouldThrow_whenFileTooLarge() {
    var userId = UUID.randomUUID();
    var file = mock(MultipartFile.class);
    when(file.isEmpty()).thenReturn(false);
    when(file.getSize()).thenReturn(10 * 1024 * 1024L); // 10MB

    var exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> storageService.uploadProfilePicture(userId, file));
    assertEquals("File size exceeds maximum allowed size of 5MB", exception.getMessage());
  }

  @Test
  void uploadProfilePicture_shouldThrow_whenInvalidContentType() {
    var userId = UUID.randomUUID();
    var file = mock(MultipartFile.class);
    when(file.isEmpty()).thenReturn(false);
    when(file.getSize()).thenReturn(1024L);
    when(file.getContentType()).thenReturn("application/pdf");

    var exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> storageService.uploadProfilePicture(userId, file));
    assertEquals("Invalid file type. Allowed types: JPEG, PNG, WebP, GIF", exception.getMessage());
  }

  @Test
  void uploadProfilePicture_shouldThrow_whenContentTypeNull() {
    var userId = UUID.randomUUID();
    var file = mock(MultipartFile.class);
    when(file.isEmpty()).thenReturn(false);
    when(file.getSize()).thenReturn(1024L);
    when(file.getContentType()).thenReturn(null);

    assertThrows(
        IllegalArgumentException.class, () -> storageService.uploadProfilePicture(userId, file));
  }

  @Test
  void deleteFile_shouldDeleteObject_whenValidUrl() {
    var fileUrl = "https://s3.example.com/test-bucket/profiles/user123/image.jpg";

    storageService.deleteFile(fileUrl);

    verify(s3Client).deleteObject(any(DeleteObjectRequest.class));
  }

  @Test
  void deleteFile_shouldDoNothing_whenUrlNull() {
    storageService.deleteFile(null);

    verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
  }

  @Test
  void deleteFile_shouldDoNothing_whenUrlBlank() {
    storageService.deleteFile("   ");

    verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
  }

  @Test
  void deleteFile_shouldDoNothing_whenUrlDoesNotContainBucket() {
    var invalidUrl = "https://other.example.com/other-bucket/file.jpg";

    storageService.deleteFile(invalidUrl);

    verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
  }

  @Test
  void uploadProfilePicture_shouldAcceptPng() throws IOException {
    var userId = UUID.randomUUID();
    var file = mock(MultipartFile.class);
    when(file.isEmpty()).thenReturn(false);
    when(file.getSize()).thenReturn(1024L);
    when(file.getContentType()).thenReturn("image/png");
    when(file.getOriginalFilename()).thenReturn("profile.png");
    when(file.getBytes()).thenReturn(new byte[1024]);
    when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
        .thenReturn(PutObjectResponse.builder().build());

    var url = storageService.uploadProfilePicture(userId, file);

    assertNotNull(url);
    assertTrue(url.endsWith(".png"));
  }

  @Test
  void uploadProfilePicture_shouldAcceptWebp() throws IOException {
    var userId = UUID.randomUUID();
    var file = mock(MultipartFile.class);
    when(file.isEmpty()).thenReturn(false);
    when(file.getSize()).thenReturn(1024L);
    when(file.getContentType()).thenReturn("image/webp");
    when(file.getOriginalFilename()).thenReturn("profile.webp");
    when(file.getBytes()).thenReturn(new byte[1024]);
    when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
        .thenReturn(PutObjectResponse.builder().build());

    var url = storageService.uploadProfilePicture(userId, file);

    assertNotNull(url);
    assertTrue(url.endsWith(".webp"));
  }

  @Test
  void uploadProfilePicture_shouldAcceptGif() throws IOException {
    var userId = UUID.randomUUID();
    var file = mock(MultipartFile.class);
    when(file.isEmpty()).thenReturn(false);
    when(file.getSize()).thenReturn(1024L);
    when(file.getContentType()).thenReturn("image/gif");
    when(file.getOriginalFilename()).thenReturn("profile.gif");
    when(file.getBytes()).thenReturn(new byte[1024]);
    when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
        .thenReturn(PutObjectResponse.builder().build());

    var url = storageService.uploadProfilePicture(userId, file);

    assertNotNull(url);
    assertTrue(url.endsWith(".gif"));
  }
}
