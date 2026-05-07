package com.axelfrache.questify.notification.messaging;

public final class QueueConstants {

  private QueueConstants() {}

  public static final String EXCHANGE = "questify.events";

  public static final String QUEST_SCHEDULED_ROUTING_KEY = "quest.scheduled";
  public static final String QUEST_COMPLETED_ROUTING_KEY = "quest.completed";
  public static final String USER_DELETED_ROUTING_KEY = "user.deleted";
  public static final String USER_LEVELED_UP_ROUTING_KEY = "user.leveled-up";
  public static final String STREAK_AT_RISK_ROUTING_KEY = "user.streak-at-risk";

  public static final String QUEST_SCHEDULED_QUEUE = "notification-service.quest-scheduled";
  public static final String QUEST_COMPLETED_QUEUE = "notification-service.quest-completed";
  public static final String USER_DELETED_QUEUE = "notification-service.user-deleted";
  public static final String USER_LEVELED_UP_QUEUE = "notification-service.user-leveled-up";
  public static final String STREAK_AT_RISK_QUEUE = "notification-service.streak-at-risk";
}
