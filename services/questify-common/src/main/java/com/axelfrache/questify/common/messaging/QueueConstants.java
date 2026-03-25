package com.axelfrache.questify.common.messaging;

public final class QueueConstants {

  public static final String EXCHANGE = "questify.events";

  public static final String QUEST_COMPLETED_KEY = "quest.completed";
  public static final String USER_DELETED_KEY = "user.deleted";
  public static final String LEVEL_UP_KEY = "level.up";
  public static final String ACHIEVEMENT_UNLOCKED_KEY = "achievement.unlocked";

  private QueueConstants() {}
}
