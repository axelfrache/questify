package com.axelfrache.questify.stats.messaging;

public final class QueueConstants {

  public static final String EXCHANGE = "questify.events";

  public static final String QUEST_COMPLETED_ROUTING_KEY = "quest.completed";
  public static final String QUEST_COMPLETED_QUEUE = "stats-service.quest-completed";

  public static final String USER_DELETED_ROUTING_KEY = "user.deleted";
  public static final String USER_DELETED_QUEUE = "stats-service.user-deleted";

  public static final String CATEGORY_DELETED_ROUTING_KEY = "category.deleted";
  public static final String CATEGORY_DELETED_QUEUE = "stats-service.category-deleted";

  private QueueConstants() {}
}
