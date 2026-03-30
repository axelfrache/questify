CREATE USER quest_svc       WITH PASSWORD 'quest_svc';
CREATE USER project_svc     WITH PASSWORD 'project_svc';
CREATE USER progression_svc WITH PASSWORD 'progression_svc';
CREATE USER stats_svc       WITH PASSWORD 'stats_svc';
CREATE USER admin_svc       WITH PASSWORD 'admin_svc';

GRANT CONNECT, CREATE ON DATABASE questify TO quest_svc;
GRANT CONNECT, CREATE ON DATABASE questify TO project_svc;
GRANT CONNECT, CREATE ON DATABASE questify TO progression_svc;
GRANT CONNECT, CREATE ON DATABASE questify TO stats_svc;
GRANT CONNECT, CREATE ON DATABASE questify TO admin_svc;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS quests       AUTHORIZATION quest_svc;
CREATE SCHEMA IF NOT EXISTS projects     AUTHORIZATION project_svc;
CREATE SCHEMA IF NOT EXISTS progression  AUTHORIZATION progression_svc;
CREATE SCHEMA IF NOT EXISTS stats        AUTHORIZATION stats_svc;
CREATE SCHEMA IF NOT EXISTS admin        AUTHORIZATION admin_svc;
