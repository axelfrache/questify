package com.axelfrache.questify.auth.messaging;

public final class QueueConstants {

  public static final String EXCHANGE = "questify.events";
  public static final String USER_DELETED_ROUTING_KEY = "user.deleted";

  private QueueConstants() {}
}
