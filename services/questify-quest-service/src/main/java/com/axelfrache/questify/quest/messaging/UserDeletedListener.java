package com.axelfrache.questify.quest.messaging;

import com.axelfrache.questify.quest.repository.CategoryRepository;
import com.axelfrache.questify.quest.repository.QuestHistoryRepository;
import com.axelfrache.questify.quest.repository.QuestTemplateRepository;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserDeletedListener {

  private final QuestTemplateRepository questTemplateRepository;
  private final QuestHistoryRepository questHistoryRepository;
  private final CategoryRepository categoryRepository;

  @RabbitListener(queues = QueueConstants.USER_DELETED_QUEST_QUEUE)
  @Transactional
  @WithSpan("messaging.user_deleted_quest")
  public void onUserDeleted(UserDeletedEvent event) {
    var userId = event.userId();
    setEventAttributes("user.deleted", userId);
    log.info("Cleaning up quest data for deleted user: {}", userId);

    questTemplateRepository.deleteByUserId(userId);
    questHistoryRepository.deleteByUserId(userId);
    categoryRepository.deleteByUserId(userId);

    log.info("Quest data cleanup complete for user: {}", userId);
  }

  private static void setEventAttributes(String eventType, UUID userId) {
    Span.current().setAttribute("questify.event.type", eventType);
    if (userId != null) Span.current().setAttribute("questify.user.id", userId.toString());
  }
}
