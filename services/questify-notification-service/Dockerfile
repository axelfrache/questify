FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY questify-notification-service/.mvn/ .mvn/
COPY questify-notification-service/mvnw questify-notification-service/pom.xml ./

RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY questify-notification-service/src/ src/

RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL org.opencontainers.image.title="Questify Notification Service"
LABEL org.opencontainers.image.source="https://github.com/axelfrache/questify"

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

COPY --from=build --chown=appuser:appgroup /app/target/*.jar app.jar

USER appuser

EXPOSE 8087

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8087/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
