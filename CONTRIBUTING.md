# Contributing to Questify

Thanks for your interest in contributing to Questify!
This guide explains how to contribute efficiently and consistently.

## Code of Conduct

Be respectful, constructive, and kind.
Questify aims to be a welcoming and collaborative space for everyone.

## What You Can Contribute

We welcome contributions such as:
- Bug fixes
- UI / UX improvements
- Performance optimizations
- Documentation improvements

For **new features or architectural changes**, please open an issue first to discuss the approach.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/questify.git
   cd questify
   ```
3. **Add upstream**
   ```bash
   git remote add upstream https://github.com/axelfrache/questify.git
   ```
4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites
- Java 21
- Node.js 20+
- pnpm
- Docker & Docker Compose

### Run locally

**All services (dockerized)**
```bash
cp .env.example .env
docker compose up -d --build
```
→ Gateway: http://localhost:8080
→ Frontend: http://localhost:80

**Individual service**
```bash
cd services/questify-<service-name>
./mvnw spring-boot:run
```

**Frontend**
```bash
cd frontend && pnpm install && pnpm run dev
```
→ http://localhost:5173

## Code Quality (Mandatory)

CI will fail if formatting or linting is incorrect.

| Component | Check | Fix |
|----------|------|-----|
| Service | `./mvnw spotless:check` | `./mvnw spotless:apply` |
| Frontend | `pnpm run format:check && pnpm run lint` | `pnpm run format` |

Before pushing:
```bash
# In each modified service
cd services/questify-<service-name> && ./mvnw spotless:apply && ./mvnw verify

# Frontend
cd frontend && pnpm run format && pnpm run lint && pnpm run build
```

## Commit Conventions

We use **Conventional Commits**.

```
<type>(<scope>): <description>
```

Common scopes: `auth`, `quest`, `project`, `progression`, `stats`, `admin`, `frontend`, `infra`, `docs`

Examples:
```
feat(quest): add recurrence support for templates
fix(auth): prevent duplicate user registration
docs: improve contributing guide
chore(deps): update Spring Boot
```

## Pull Request Process

1. Rebase on latest `main`
   ```bash
   git fetch upstream && git rebase upstream/main
   ```
2. Ensure all checks pass
3. Open a PR against `main`

PR description should include:
- What changed
- Why it was needed
- How to test
- Screenshots for UI changes

## Need Help?

- Check existing issues: https://github.com/axelfrache/questify/issues
- Open an issue for bugs or feature proposals

Thanks for contributing to Questify 🐢✨
