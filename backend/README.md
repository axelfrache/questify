# Questify Backend

## Description

REST API for Questify, a gamified task management application. Built with Spring Boot 4.

## Tech Stack

- **Framework**: Spring Boot 4.0.1
- **Language**: Java 21
- **Database**: PostgreSQL (H2 for development)
- **Security**: Spring Security + JWT
- **Storage**: AWS S3 (MinIO for local development)
- **Build Tool**: Maven

## Getting Started

### Prerequisites

- Java 21
- Maven (or use the wrapper `./mvnw`)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/questify
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
```

### Running

**Development mode:**
```bash
./mvnw spring-boot:run
```

**Build:**
```bash
./mvnw clean package -DskipTests
```

**Run JAR:**
```bash
java -jar target/questify-0.0.1-SNAPSHOT.jar
```

### Endpoints

- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console: http://localhost:8080/h2-console

## Project Structure

```
src/main/java/com/axelfrache/questify/
├── config/         # Configuration classes
├── controller/     # REST controllers
├── dto/            # Data Transfer Objects
├── model/          # JPA entities
├── repository/     # Spring Data repositories
├── security/       # JWT & Security configuration
└── service/        # Business logic
```

## Code Quality

This project uses **Spotless** with Google Java Format.

```bash
./mvnw spotless:check  # Check formatting
./mvnw spotless:apply  # Fix formatting
```

## Testing

```bash
./mvnw test
```

## License

MIT License - see [LICENSE](../LICENSE) for details.
