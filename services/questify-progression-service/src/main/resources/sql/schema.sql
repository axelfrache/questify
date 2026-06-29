CREATE SCHEMA IF NOT EXISTS progression;

CREATE TABLE IF NOT EXISTS progression.user_progressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    total_xp BIGINT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 1,
    grade VARCHAR(32) NOT NULL DEFAULT 'INITIATE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS progression.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    icon VARCHAR(64),
    type VARCHAR(32) NOT NULL,
    threshold INT NOT NULL DEFAULT 1,
    category_name VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS progression.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL REFERENCES progression.achievements(id),
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS progression.quest_completion_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    quest_id UUID NOT NULL,
    category_name VARCHAR(128),
    completed_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_qcr_user_id ON progression.quest_completion_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ua_user_id ON progression.user_achievements(user_id);

UPDATE progression.user_progressions SET grade = 'FLINT'    WHERE grade = 'INITIATE';
UPDATE progression.user_progressions SET grade = 'IRON'     WHERE grade = 'TRAVELER';
UPDATE progression.user_progressions SET grade = 'GOLD'     WHERE grade = 'EXPLORER';
UPDATE progression.user_progressions SET grade = 'OBSIDIAN' WHERE grade = 'ADVENTURER';
UPDATE progression.user_progressions SET grade = 'SAPPHIRE' WHERE grade = 'HERO';
UPDATE progression.user_progressions SET grade = 'DIAMOND'  WHERE grade = 'LEGEND';

ALTER TABLE progression.user_progressions ALTER COLUMN grade SET DEFAULT 'FLINT';
