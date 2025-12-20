# Questify

## Description

Questify is a gamified task management application designed to help users progress consistently over time.

Instead of treating tasks as simple checklists, Questify reframes them as quests that contribute to a personal progression system inspired by RPG mechanics with XP, levels, narrative grades and achievements.

### Core Principles

- **Execution over planning**: XP is earned by completing quests.
- **Narrative progression**: grades represent a journey (Initiate → Traveler → Explorer…), not a ranking.
- **Transparency**: simple XP rules, predictable progression.
- **Extensible architecture**: designed for long-term evolution.

## Getting Started

The application is divided in 2 parts: **backend** and **frontend**.

### Prerequisites

- Java 21
- Node.js 20
- Docker & Docker Compose

## Running

### Locally (development mode)

**Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then go to:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

### Locally (fully dockerized)

```bash
docker compose up -d --build
```

Then go to:
- Frontend: http://localhost:80
- Backend API: http://localhost:8080

To stop the application:
```bash
docker compose down
```

Use `-v` if you want to remove volumes too.

## Code Quality

For code quality, we use:
- **Backend**: Spotless with Google Java Format
- **Frontend**: ESLint and Prettier

### Commands

**Backend:**
```bash
cd backend
./mvnw spotless:check  # Check formatting
./mvnw spotless:apply  # Fix formatting
```

**Frontend:**
```bash
cd frontend
npm run lint          # Check linting
npm run format:check  # Check formatting
npm run format        # Fix formatting
```

> **Warning**: Those are mandatory before pushing code, if it is not done the CI will fail.

## License

This project is distributed under [MIT License](LICENSE).