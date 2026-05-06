package com.axelfrache.questify.notification.repository;

import com.axelfrache.questify.notification.model.Notification;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

  long countByUserIdAndReadFalse(UUID userId);

  @Modifying
  @Query("UPDATE Notification n SET n.read = true WHERE n.userId = :userId AND n.read = false")
  int markAllReadByUserId(UUID userId);

  void deleteByUserId(UUID userId);

  @Query(
      value =
          """
          DELETE FROM notifications.notifications
          WHERE user_id = :userId
            AND id NOT IN (
              SELECT id FROM notifications.notifications
              WHERE user_id = :userId
              ORDER BY created_at DESC
              LIMIT :maxCount
            )
          """,
      nativeQuery = true)
  @Modifying
  void pruneOldestForUser(UUID userId, int maxCount);
}
