# ── Stage 1: Build (discarded after — doesn't affect final image size) ────────
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Run — distroless Java 17 (~85MB vs 180MB Alpine) ────────────────
# No shell, no package manager — minimal attack surface, lower memory footprint
FROM gcr.io/distroless/java17-debian12

WORKDIR /app

COPY --from=build /app/target/task-manager-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
