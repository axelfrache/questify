package com.axelfrache.questify.project.messaging;

public final class QueueConstants {

  private QueueConstants() {}

  public static final String EXCHANGE = "questify.events";

  public static final String PROJECT_DELETED_ROUTING_KEY = "project.deleted";
  public static final String USER_DELETED_ROUTING_KEY = "user.deleted";

  public static final String USER_DELETED_QUEUE = "project-service.user-deleted";
}
