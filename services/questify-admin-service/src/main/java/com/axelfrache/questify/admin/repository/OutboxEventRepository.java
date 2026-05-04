package com.axelfrache.questify.admin.repository;

import com.axelfrache.questify.admin.model.OutboxEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

  @Query(
      value =
          """
          SELECT *
          FROM admin.outbox_events
          WHERE status = 'PENDING'
            AND (next_attempt_at IS NULL OR next_attempt_at <= now())
          ORDER BY created_at
          LIMIT 50
          FOR UPDATE SKIP LOCKED
          """,
      nativeQuery = true)
  List<OutboxEvent> findPendingBatchForUpdate();
}
