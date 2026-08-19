# Questify

[![CI](https://github.com/axelfrache/questify/actions/workflows/ci.yml/badge.svg)](https://github.com/axelfrache/questify/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.x-6DB33F?logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Helm-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)

## Description

Questify is a gamified task management application designed to help users progress consistently over time.

Instead of treating tasks as simple checklists, Questify reframes them as quests that contribute to a personal progression system inspired by RPG mechanics with XP, levels, narrative grades and achievements.

### Core Principles

- **Execution over planning**: XP is earned by completing quests.
- **Narrative progression**: grades represent a journey (Initiate → Traveler → Explorer…), not a ranking.
- **Transparency**: simple XP rules, predictable progression.
- **Extensible architecture**: designed for long-term evolution.

## Architecture

Questify is built as a **microservices** application:

| Service | Role | Port |
|---------|------|------|
| `questify-auth-service` | Authentication, JWT, user management | 8081 |
| `questify-quest-service` | Quests, templates, recurrence | 8082 |
| `questify-project-service` | Projects | 8083 |
| `questify-progression-service` | XP, levels, achievements | 8084 |
| `questify-stats-service` | Statistics | 8085 |
| `questify-admin-service` | Admin panel | 8086 |
| `gateway` | Nginx reverse proxy | 8080 |
| `frontend` | React/Vite UI | 80 |
| `postgres` | Persistent data store | 5432 |
| `rabbitmq` | Domain event broker | 5672 / 15672 |
| `redis` | Cache-aside store for read models | 6379 |

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20 + pnpm (frontend development only)
- Java 21 (service development only)

## Running

### Fully dockerized (recommended)

Copy the environment file and start all services:

```bash
cp .env.example .env
docker compose up -d --build
```

Then go to:
- Frontend: http://localhost:80
- Gateway API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html (per service)

To stop:
```bash
docker compose down
```

Use `-v` to also remove volumes.

### Frontend only (development mode)

```bash
cd frontend
pnpm install
pnpm run dev
```

→ http://localhost:5173

### Individual service (development mode)

```bash
cd services/questify-<service-name>
./mvnw spring-boot:run
```

## Code Quality

- **Services**: Spotless with Google Java Format
- **Frontend**: ESLint and Prettier

### Commands

**Service (run from `services/questify-<service-name>`):**
```bash
./mvnw spotless:check  # Check formatting
./mvnw spotless:apply  # Fix formatting
```

**All services (run from repository root):**
```bash
make spotless        # Fix service formatting
make spotless-check  # Check service formatting
```

**Frontend:**
```bash
cd frontend
pnpm run lint          # Check linting
pnpm run format:check  # Check formatting
pnpm run format        # Fix formatting
```

> **Warning**: Formatting and linting are checked by CI on every push. Fix them before pushing.

## License

Copyright (C) 2026 Axel Frache.

This project is distributed under the [GNU Affero General Public License v3.0](LICENSE).
Because Questify is served over a network, any modified version you run as a
network service must make its source available to its users (AGPL §13).
