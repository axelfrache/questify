package com.axelfrache.questify.notification.repository;

import com.axelfrache.questify.notification.model.PushSubscription;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

  List<PushSubscription> findByUserId(UUID userId);

  Optional<PushSubscription> findByUserIdAndEndpoint(UUID userId, String endpoint);

  void deleteByUserIdAndEndpoint(UUID userId, String endpoint);

  void deleteByUserId(UUID userId);
}
