FROM eclipse-temurin:21-jdk-alpine AS build-common

WORKDIR /common
COPY questify-common/ .
COPY questify-progression-service/.mvn/ .mvn/
COPY questify-progression-service/mvnw .
RUN chmod +x mvnw && ./mvnw install -DskipTests -B

FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY --from=build-common /root/.m2/repository/com/axelfrache /root/.m2/repository/com/axelfrache
COPY questify-progression-service/.mvn/ .mvn/
COPY questify-progression-service/mvnw questify-progression-service/pom.xml ./

RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY questify-progression-service/src/ src/

RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL org.opencontainers.image.title="Questify Progression Service"
LABEL org.opencontainers.image.source="https://github.com/axelfrache/questify"

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

COPY --from=build --chown=appuser:appgroup /app/target/*.jar app.jar

USER appuser

EXPOSE 8084

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8084/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
