package com.axelfrache.questify.quest.messaging;

import com.axelfrache.questify.quest.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredListener {

  private final CategoryService categoryService;

  @RabbitListener(queues = QueueConstants.USER_REGISTERED_QUEST_QUEUE)
  @Transactional
  public void onUserRegistered(UserRegisteredEvent event) {
    var userId = event.userId();
    if (userId == null) {
      log.warn("Received UserRegisteredEvent without userId, ignoring.");
      return;
    }

    categoryService.seedDefaultCategoriesForUser(userId);
    log.info("Default categories ensured for user: {}", userId);
  }
}
