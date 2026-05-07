package com.axelfrache.questify.progression.messaging;

public final class QueueConstants {

  private QueueConstants() {}

  public static final String EXCHANGE = "questify.events";

  public static final String QUEST_COMPLETED_ROUTING_KEY = "quest.completed";
  public static final String USER_DELETED_ROUTING_KEY = "user.deleted";
  public static final String USER_LEVELED_UP_ROUTING_KEY = "user.leveled-up";
  public static final String STREAK_AT_RISK_ROUTING_KEY = "user.streak-at-risk";

  public static final String QUEST_COMPLETED_QUEUE = "progression.quest.completed";
  public static final String USER_DELETED_QUEUE = "progression.user.deleted";
}
