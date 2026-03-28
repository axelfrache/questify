CREATE SCHEMA IF NOT EXISTS projects;

CREATE TABLE IF NOT EXISTS projects.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(2000),
    icon VARCHAR(10),
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
