package com.axelfrache.questify.quest.messaging;

public final class QueueConstants {

  private QueueConstants() {}

  public static final String EXCHANGE = "questify.events";
  public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";
  public static final String USER_DELETED_ROUTING_KEY = "user.deleted";
  public static final String QUEST_COMPLETED_ROUTING_KEY = "quest.completed";
  public static final String QUEST_SCHEDULED_ROUTING_KEY = "quest.scheduled";
  public static final String QUEST_DELETED_ROUTING_KEY = "quest.deleted";
  public static final String PROJECT_DELETED_ROUTING_KEY = "project.deleted";
  public static final String QUEST_COMPLETED_QUEUE = "quest-service.quest-completed";
  public static final String USER_REGISTERED_QUEST_QUEUE = "quest-service.user-registered";
  public static final String USER_DELETED_QUEST_QUEUE = "quest-service.user-deleted";
  public static final String PROJECT_DELETED_QUEUE = "quest-service.project-deleted";
}
