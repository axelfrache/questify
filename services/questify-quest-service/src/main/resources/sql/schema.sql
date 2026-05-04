CREATE SCHEMA IF NOT EXISTS quests;

CREATE TABLE IF NOT EXISTS quests.outbox_events (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    routing_key VARCHAR(255) NOT NULL,
    payload     TEXT         NOT NULL,
    type_id     VARCHAR(512) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    attempts     INTEGER      NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,
    last_error   TEXT
);

ALTER TABLE quests.outbox_events ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quests.outbox_events ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;
ALTER TABLE quests.outbox_events ADD COLUMN IF NOT EXISTS last_error TEXT;

UPDATE quests.outbox_events
SET status = 'PENDING',
    next_attempt_at = now()
WHERE status = 'FAILED';

CREATE INDEX IF NOT EXISTS idx_quest_outbox_pending_retry
    ON quests.outbox_events (next_attempt_at, created_at)
    WHERE status = 'PENDING';
