package com.axelfrache.questify.progression.scheduler;

import com.axelfrache.questify.progression.messaging.QueueConstants;
import com.axelfrache.questify.progression.messaging.StreakAtRiskEvent;
import com.axelfrache.questify.progression.repository.QuestCompletionRecordRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StreakScheduler {

  private final QuestCompletionRecordRepository completionRecordRepository;
  private final RabbitTemplate rabbitTemplate;

  @Scheduled(cron = "${questify.streak.check-cron:0 0 18 * * *}")
  public void checkStreaksAtRisk() {
    var today = LocalDate.now(ZoneOffset.UTC);
    var todayStart = today.atStartOfDay(ZoneOffset.UTC).toInstant();
    var yesterdayStart = today.minusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

    var completedYesterday =
        completionRecordRepository.findDistinctUserIdsWithCompletionBetween(
            yesterdayStart, todayStart);

    var now = Instant.now();
    var atRiskCount =
        completedYesterday.stream()
            .filter(
                userId ->
                    !completionRecordRepository.existsByUserIdAndCompletedAtBetween(
                        userId, todayStart, now))
            .peek(
                userId ->
                    rabbitTemplate.convertAndSend(
                        QueueConstants.EXCHANGE,
                        QueueConstants.STREAK_AT_RISK_ROUTING_KEY,
                        new StreakAtRiskEvent(userId)))
            .count();

    log.info("Streak at risk check: {}/{} users notified", atRiskCount, completedYesterday.size());
  }
}
