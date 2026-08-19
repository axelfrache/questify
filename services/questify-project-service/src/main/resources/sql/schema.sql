CREATE SCHEMA IF NOT EXISTS projects;

CREATE TABLE IF NOT EXISTS projects.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(2000),
    icon VARCHAR(10),
    invite_link_token VARCHAR(255) UNIQUE,
    invite_link_enabled BOOLEAN NOT NULL DEFAULT false,
    invite_link_role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS invite_link_token VARCHAR(255) UNIQUE;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS invite_link_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE projects.projects ADD COLUMN IF NOT EXISTS invite_link_role VARCHAR(20) NOT NULL DEFAULT 'MEMBER';

CREATE INDEX IF NOT EXISTS idx_projects_owner_user_id ON projects.projects(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects.projects(updated_at);

CREATE TABLE IF NOT EXISTS projects.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects.projects(id),
    user_id UUID NOT NULL,
    role VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON projects.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON projects.project_members(project_id);

CREATE TABLE IF NOT EXISTS projects.user_project_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES projects.projects(id),
    pinned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_project_pins_user_id ON projects.user_project_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_pins_pinned_at ON projects.user_project_pins(pinned_at);

CREATE TABLE IF NOT EXISTS projects.outbox_events (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    routing_key     VARCHAR(255) NOT NULL,
    payload         TEXT         NOT NULL,
    type_id         VARCHAR(512) NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    processed_at    TIMESTAMPTZ,
    attempts        INTEGER      NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,
    last_error      TEXT
);

ALTER TABLE projects.outbox_events ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects.outbox_events ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;
ALTER TABLE projects.outbox_events ADD COLUMN IF NOT EXISTS last_error TEXT;

UPDATE projects.outbox_events
SET status = 'PENDING',
    next_attempt_at = now()
WHERE status = 'FAILED';

CREATE INDEX IF NOT EXISTS idx_projects_outbox_pending
    ON projects.outbox_events (next_attempt_at, created_at)
    WHERE status = 'PENDING';

CREATE TABLE IF NOT EXISTS projects.project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(320),
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_by_user_id UUID,
    accepted_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects.project_invitations ADD COLUMN IF NOT EXISTS email VARCHAR(320);
ALTER TABLE projects.project_invitations ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'MEMBER';
ALTER TABLE projects.project_invitations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON projects.project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON projects.project_invitations(project_id);
