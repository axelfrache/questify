package com.axelfrache.questify.notification.repository;

import com.axelfrache.questify.notification.model.ScheduledReminder;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ScheduledReminderRepository extends JpaRepository<ScheduledReminder, UUID> {

  Optional<ScheduledReminder> findByUserIdAndOccurrenceId(UUID userId, UUID occurrenceId);

  @Query(
      """
      SELECT r FROM ScheduledReminder r
      WHERE r.reminderSent = false
        AND r.completed = false
        AND r.scheduledDate <= :cutoffDate
      """)
  List<ScheduledReminder> findDueReminders(LocalDate cutoffDate);

  void deleteByUserId(UUID userId);
}
