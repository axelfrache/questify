CREATE SCHEMA IF NOT EXISTS notifications;

CREATE TABLE IF NOT EXISTS notifications.notifications
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL,
    type       VARCHAR(50) NOT NULL,
    title      TEXT        NOT NULL,
    body       TEXT        NOT NULL,
    quest_id   UUID,
    read       BOOLEAN     NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications.notifications (user_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications.scheduled_reminders
(
    id             UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL,
    template_id    UUID        NOT NULL,
    occurrence_id  UUID,
    quest_title    TEXT        NOT NULL,
    scheduled_date DATE        NOT NULL,
    reminder_sent  BOOLEAN     NOT NULL DEFAULT false,
    completed      BOOLEAN     NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, occurrence_id)
);

CREATE INDEX IF NOT EXISTS idx_reminders_pending
    ON notifications.scheduled_reminders (scheduled_date, reminder_sent, completed)
    WHERE reminder_sent = false AND completed = false;

CREATE TABLE IF NOT EXISTS notifications.push_subscriptions
(
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL,
    endpoint   TEXT NOT NULL,
    p256dh     TEXT NOT NULL,
    auth_key   TEXT NOT NULL,
    created_at TIMESTAMPTZ      DEFAULT now(),
    UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
    ON notifications.push_subscriptions (user_id);
