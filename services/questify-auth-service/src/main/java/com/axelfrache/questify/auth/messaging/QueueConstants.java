package com.axelfrache.questify.auth.messaging;

public final class QueueConstants {

  public static final String EXCHANGE = "questify.events";

  public static final String USER_DELETED_ROUTING_KEY = "user.deleted";
  public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";

  public static final String ADMIN_USER_DELETED_ROUTING_KEY = "admin.user.deleted";
  public static final String ADMIN_USER_DELETED_QUEUE = "auth-service.admin-user-deleted";

  public static final String ADMIN_USER_ROLE_CHANGED_ROUTING_KEY = "admin.user.role-changed";
  public static final String ADMIN_USER_ROLE_CHANGED_QUEUE = "auth-service.admin-user-role-changed";

  public static final String ADMIN_USER_STATUS_CHANGED_ROUTING_KEY = "admin.user.status-changed";
  public static final String ADMIN_USER_STATUS_CHANGED_QUEUE =
      "auth-service.admin-user-status-changed";

  private QueueConstants() {}
}
