FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY questify-auth-service/.mvn/ .mvn/
COPY questify-auth-service/mvnw questify-auth-service/pom.xml ./

RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY questify-auth-service/src/ src/

RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL org.opencontainers.image.title="Questify Auth Service"
LABEL org.opencontainers.image.source="https://github.com/axelfrache/questify"

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

COPY --from=build --chown=appuser:appgroup /app/target/*.jar app.jar

USER appuser

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
