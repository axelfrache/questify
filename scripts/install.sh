#!/bin/bash
set -euo pipefail

cleanup() {
    if [ -f "get-docker.sh" ]; then
        rm -f get-docker.sh
    fi
}
trap cleanup EXIT ERR INT TERM

echo "=========================================================="
echo "          Questify Stack Installation Script              "
echo "=========================================================="

for cmd in curl openssl tr head grep hostname date; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: '$cmd' is required but not installed. Please install it first."
        exit 1
    fi
done

if ! command -v sudo >/dev/null 2>&1; then
    echo "Error: 'sudo' is required but not installed."
    exit 1
fi
sudo -v
( while true; do sudo -n true; sleep 60; kill -0 "$$" || exit 0; done ) 2>/dev/null &

if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    echo "=========================================================="
    echo "Docker installed. You may need to run:"
    echo "  sudo usermod -aG docker \$USER"
    echo "=========================================================="
else
    echo "Docker is already installed."
fi

if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
    echo "Error: Docker Compose is not installed."
    echo "Please install the docker-compose-plugin:"
    echo "  Debian/Ubuntu: sudo apt install docker-compose-plugin"
    echo "  Fedora:        sudo dnf install docker-compose-plugin"
    echo "  Arch Linux:    sudo pacman -S docker-compose"
    exit 1
fi

INSTALL_DIR="/opt/questify"
echo "Setting up Questify in $INSTALL_DIR..."
sudo mkdir -p "$INSTALL_DIR"
sudo chown "$USER:$USER" "$INSTALL_DIR"
cd "$INSTALL_DIR"

LOCAL_IP="$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.' | head -n1 || true)"
LOCAL_IP="${LOCAL_IP:-localhost}"
echo "Detected local IP: $LOCAL_IP"
echo "Note: If you plan to use a domain name, update CORS_ALLOWED_ORIGINS in the .env file later."

if [ -f .env ]; then
    echo "Existing .env found. Preserving credentials..."
    BACKUP_FILE=".env.bak.$(date +%Y%m%d-%H%M%S)"
    cp .env "$BACKUP_FILE"
    chmod 600 "$BACKUP_FILE" || true
    set -a
    source .env
    set +a
    DB_PASS=${POSTGRES_PASSWORD:-$(openssl rand -hex 24)}
    RABBITMQ_PASS=${RABBITMQ_PASSWORD:-$(openssl rand -hex 16)}
    GARAGE_RPC_SECRET=${GARAGE_RPC_SECRET:-$(openssl rand -hex 32)}
    GARAGE_KEY_ID=${GARAGE_ACCESS_KEY_ID:-"GK$(openssl rand -hex 12)"}
    GARAGE_SECRET_KEY=${GARAGE_SECRET_ACCESS_KEY:-$(openssl rand -hex 32)}
    JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}
    ADMIN_PASS=${ADMIN_PASSWORD:-$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 16 || echo -n "admin1234Secure")}
    ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@questify.local"}
    QUEST_DB_PASS=${QUEST_DB_PASSWORD:-$(openssl rand -hex 16)}
    PROJECT_DB_PASS=${PROJECT_DB_PASSWORD:-$(openssl rand -hex 16)}
    PROGRESSION_DB_PASS=${PROGRESSION_DB_PASSWORD:-$(openssl rand -hex 16)}
    STATS_DB_PASS=${STATS_DB_PASSWORD:-$(openssl rand -hex 16)}
    ADMIN_DB_PASS=${ADMIN_DB_PASSWORD:-$(openssl rand -hex 16)}
else
    echo "Generating secure secrets..."
    DB_PASS=$(openssl rand -hex 24)
    RABBITMQ_PASS=$(openssl rand -hex 16)
    GARAGE_RPC_SECRET=$(openssl rand -hex 32)
    GARAGE_KEY_ID="GK$(openssl rand -hex 12)"
    GARAGE_SECRET_KEY=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 32)
    ADMIN_PASS=$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 16 || echo -n "admin1234Secure")
    ADMIN_EMAIL="admin@questify.local"
    QUEST_DB_PASS=$(openssl rand -hex 16)
    PROJECT_DB_PASS=$(openssl rand -hex 16)
    PROGRESSION_DB_PASS=$(openssl rand -hex 16)
    STATS_DB_PASS=$(openssl rand -hex 16)
    ADMIN_DB_PASS=$(openssl rand -hex 16)
fi

echo "Creating .env configuration..."
cat > .env << EOF
# PostgreSQL
POSTGRES_DB=questify
POSTGRES_USER=questify
POSTGRES_PASSWORD=$DB_PASS

# RabbitMQ
RABBITMQ_USER=questify
RABBITMQ_PASSWORD=$RABBITMQ_PASS

# Garage S3
GARAGE_RPC_SECRET=$GARAGE_RPC_SECRET
GARAGE_ACCESS_KEY_ID=$GARAGE_KEY_ID
GARAGE_SECRET_ACCESS_KEY=$GARAGE_SECRET_KEY

# JWT
JWT_SECRET=$JWT_SECRET

# Admin bootstrap account
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASS

# Service-specific DB users
QUEST_DB_USER=quest_svc
QUEST_DB_PASSWORD=$QUEST_DB_PASS
PROJECT_DB_USER=project_svc
PROJECT_DB_PASSWORD=$PROJECT_DB_PASS
PROGRESSION_DB_USER=progression_svc
PROGRESSION_DB_PASSWORD=$PROGRESSION_DB_PASS
STATS_DB_USER=stats_svc
STATS_DB_PASSWORD=$STATS_DB_PASS
ADMIN_DB_USER=admin_svc
ADMIN_DB_PASSWORD=$ADMIN_DB_PASS

# CORS
CORS_ALLOWED_ORIGINS=http://localhost,http://127.0.0.1,http://$LOCAL_IP

# Security
COOKIE_SECURE=false
EOF
chmod 600 .env

echo "Creating database initialization script..."
mkdir -p db
cat > db/init.sh << EOF
#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE SCHEMA IF NOT EXISTS auth;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE USER quest_svc WITH PASSWORD '$QUEST_DB_PASS';"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT CREATE ON DATABASE questify TO quest_svc;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE SCHEMA IF NOT EXISTS quests;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT ALL PRIVILEGES ON SCHEMA quests TO quest_svc;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE USER project_svc WITH PASSWORD '$PROJECT_DB_PASS';"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT CREATE ON DATABASE questify TO project_svc;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE SCHEMA IF NOT EXISTS projects;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT ALL PRIVILEGES ON SCHEMA projects TO project_svc;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE USER progression_svc WITH PASSWORD '$PROGRESSION_DB_PASS';"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT CREATE ON DATABASE questify TO progression_svc;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE SCHEMA IF NOT EXISTS progression;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT ALL PRIVILEGES ON SCHEMA progression TO progression_svc;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE USER stats_svc WITH PASSWORD '$STATS_DB_PASS';"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT CREATE ON DATABASE questify TO stats_svc;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE SCHEMA IF NOT EXISTS stats;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT ALL PRIVILEGES ON SCHEMA stats TO stats_svc;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE USER admin_svc WITH PASSWORD '$ADMIN_DB_PASS';"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT CREATE ON DATABASE questify TO admin_svc;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "CREATE SCHEMA IF NOT EXISTS admin;"
psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" -c "GRANT ALL PRIVILEGES ON SCHEMA admin TO admin_svc;"
EOF
chmod +x db/init.sh

echo "Creating Garage S3 configuration..."
mkdir -p garage/data/meta garage/data/data
sudo chown -R 1000:1000 garage/data
cat > garage/garage.toml << 'TOML'
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "lmdb"
replication_factor = 1
rpc_bind_addr = "0.0.0.0:3901"

[s3_api]
s3_region = "garage"
api_bind_addr = "0.0.0.0:3900"

[admin]
api_bind_addr = "0.0.0.0:3903"
TOML

cat > garage/entrypoint.sh << 'SH'
#!/bin/sh

garage -c /etc/garage.toml server &

echo "Waiting for Garage to be ready..."
until garage -c /etc/garage.toml status >/dev/null 2>&1; do
    sleep 2
done

if [ ! -f /var/lib/garage/meta/.setup-done ]; then
    echo "Running initial Garage setup..."

    NODE_ID=$(garage -c /etc/garage.toml node id | awk '{print $1}')
    garage -c /etc/garage.toml layout assign "$NODE_ID" -z dc1 -c 1G || true
    garage -c /etc/garage.toml layout apply --version 1 || true

    garage -c /etc/garage.toml bucket create questify-profiles || true

    garage -c /etc/garage.toml key import \
        --yes \
        -n questify-key \
        "$GARAGE_ACCESS_KEY_ID" \
        "$GARAGE_SECRET_ACCESS_KEY" || true

    garage -c /etc/garage.toml bucket allow \
        --read --write --owner questify-profiles \
        --key questify-key || true

    touch /var/lib/garage/meta/.setup-done
    echo "Garage setup complete"
fi

touch /tmp/garage-ready
wait
SH
chmod +x garage/entrypoint.sh

echo "Creating gateway configuration..."
mkdir -p gateway
cat > gateway/nginx.conf << 'NGINX'
events {
    worker_connections 1024;
}

http {
    resolver 127.0.0.11 valid=10s;
    keepalive_timeout 65;

    upstream auth_svc        { server auth-service:8081; }
    upstream quest_svc       { server quest-service:8082; }
    upstream project_svc     { server project-service:8083; }
    upstream progression_svc { server progression-service:8084; }
    upstream stats_svc       { server stats-service:8085; }
    upstream admin_svc       { server admin-service:8086; }

    server {
        listen 8080;

        location = /_auth/validate {
            internal;
            proxy_pass              http://auth_svc/api/auth/validate;
            proxy_pass_request_body off;
            proxy_set_header        Content-Length  "";
            proxy_set_header        Host            $host;
            proxy_set_header        Cookie          $http_cookie;
            proxy_set_header        Authorization   $http_authorization;
        }

        location /api/auth/ {
            proxy_pass         http://auth_svc;
            proxy_set_header   Host              $host;
            proxy_set_header   X-Real-IP         $remote_addr;
            proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
        }

        location ~ ^/api/users/[^/]+/progression {
            auth_request     /_auth/validate;
            auth_request_set $x_user_id   $upstream_http_x_user_id;
            auth_request_set $x_user_role $upstream_http_x_user_role;
            rewrite ^/api/users/[^/]+/progression(.*)$ /api/progression$1 break;
            proxy_pass       http://progression_svc;
            proxy_set_header X-User-Id   $x_user_id;
            proxy_set_header X-User-Role $x_user_role;
            proxy_set_header Host        $host;
        }

        location /api/users/ {
            auth_request     /_auth/validate;
            auth_request_set $x_user_id   $upstream_http_x_user_id;
            auth_request_set $x_user_role $upstream_http_x_user_role;
            proxy_pass       http://auth_svc;
            proxy_set_header X-User-Id   $x_user_id;
            proxy_set_header X-User-Role $x_user_role;
            proxy_set_header Host        $host;
        }

        location ~ ^/api/(quests|occurrences|categories|history) {
            auth_request     /_auth/validate;
            auth_request_set $x_user_id   $upstream_http_x_user_id;
            auth_request_set $x_user_role $upstream_http_x_user_role;
            proxy_pass       http://quest_svc;
            proxy_set_header X-User-Id   $x_user_id;
            proxy_set_header X-User-Role $x_user_role;
            proxy_set_header Host        $host;
        }

        location /api/projects {
            auth_request     /_auth/validate;
            auth_request_set $x_user_id   $upstream_http_x_user_id;
            auth_request_set $x_user_role $upstream_http_x_user_role;
            proxy_pass       http://project_svc;
            proxy_set_header X-User-Id   $x_user_id;
            proxy_set_header X-User-Role $x_user_role;
            proxy_set_header Host        $host;
        }

        location /api/stats {
            auth_request     /_auth/validate;
            auth_request_set $x_user_id   $upstream_http_x_user_id;
            auth_request_set $x_user_role $upstream_http_x_user_role;
            proxy_pass       http://stats_svc;
            proxy_set_header X-User-Id   $x_user_id;
            proxy_set_header X-User-Role $x_user_role;
            proxy_set_header Host        $host;
        }

        location /api/admin {
            auth_request     /_auth/validate;
            auth_request_set $x_user_id   $upstream_http_x_user_id;
            auth_request_set $x_user_role $upstream_http_x_user_role;
            proxy_pass       http://admin_svc;
            proxy_set_header X-User-Id   $x_user_id;
            proxy_set_header X-User-Role $x_user_role;
            proxy_set_header Host        $host;
        }
    }
}
NGINX

echo "Creating docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: questify-postgres
    restart: unless-stopped
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/init.sh:/docker-entrypoint-initdb.d/init.sh:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - questify-network

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: questify-rabbitmq
    restart: unless-stopped
    ports:
      - "127.0.0.1:5672:5672"
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks:
      - questify-network

  garage:
    image: axelfrache/questify-garage:latest
    container_name: questify-garage
    restart: unless-stopped
    ports:
      - "127.0.0.1:3900:3900"
    environment:
      GARAGE_RPC_SECRET: ${GARAGE_RPC_SECRET}
      GARAGE_ACCESS_KEY_ID: ${GARAGE_ACCESS_KEY_ID}
      GARAGE_SECRET_ACCESS_KEY: ${GARAGE_SECRET_ACCESS_KEY}
    volumes:
      - ./garage/garage.toml:/etc/garage.toml:ro
      - ./garage/entrypoint.sh:/entrypoint.sh:ro
      - ./garage/data:/var/lib/garage
    entrypoint: ["/bin/sh", "/entrypoint.sh"]
    healthcheck:
      test: ["CMD-SHELL", "test -f /tmp/garage-ready"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s
    networks:
      - questify-network

  auth-service:
    image: axelfrache/questify-auth-service:latest
    container_name: questify-auth-service
    restart: unless-stopped
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      SPRING_DATASOURCE_DRIVER: org.postgresql.Driver
      SPRING_JPA_DDL_AUTO: update
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_USERNAME: ${RABBITMQ_USER}
      RABBITMQ_PASSWORD: ${RABBITMQ_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      S3_ENDPOINT: http://garage:3900
      S3_ACCESS_KEY: ${GARAGE_ACCESS_KEY_ID}
      S3_SECRET_KEY: ${GARAGE_SECRET_ACCESS_KEY}
      S3_BUCKET: questify-profiles
      S3_REGION: garage
      S3_PUBLIC_URL: http://localhost:3900
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
      COOKIE_SECURE: ${COOKIE_SECURE}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      garage:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8081/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - questify-network

  quest-service:
    image: axelfrache/questify-quest-service:latest
    container_name: questify-quest-service
    restart: unless-stopped
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      SPRING_DATASOURCE_USERNAME: ${QUEST_DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${QUEST_DB_PASSWORD}
      SPRING_DATASOURCE_DRIVER: org.postgresql.Driver
      SPRING_JPA_DDL_AUTO: update
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_USERNAME: ${RABBITMQ_USER}
      RABBITMQ_PASSWORD: ${RABBITMQ_PASSWORD}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8082/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - questify-network

  project-service:
    image: axelfrache/questify-project-service:latest
    container_name: questify-project-service
    restart: unless-stopped
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      SPRING_DATASOURCE_USERNAME: ${PROJECT_DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${PROJECT_DB_PASSWORD}
      SPRING_DATASOURCE_DRIVER: org.postgresql.Driver
      SPRING_JPA_DDL_AUTO: update
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_USERNAME: ${RABBITMQ_USER}
      RABBITMQ_PASSWORD: ${RABBITMQ_PASSWORD}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8083/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - questify-network

  progression-service:
    image: axelfrache/questify-progression-service:latest
    container_name: questify-progression-service
    restart: unless-stopped
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      SPRING_DATASOURCE_USERNAME: ${PROGRESSION_DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${PROGRESSION_DB_PASSWORD}
      SPRING_DATASOURCE_DRIVER: org.postgresql.Driver
      SPRING_JPA_DDL_AUTO: update
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_USERNAME: ${RABBITMQ_USER}
      RABBITMQ_PASSWORD: ${RABBITMQ_PASSWORD}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8084/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - questify-network

  stats-service:
    image: axelfrache/questify-stats-service:latest
    container_name: questify-stats-service
    restart: unless-stopped
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      SPRING_DATASOURCE_USERNAME: ${STATS_DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${STATS_DB_PASSWORD}
      SPRING_DATASOURCE_DRIVER: org.postgresql.Driver
      SPRING_JPA_DDL_AUTO: update
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_USERNAME: ${RABBITMQ_USER}
      RABBITMQ_PASSWORD: ${RABBITMQ_PASSWORD}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8085/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - questify-network

  admin-service:
    image: axelfrache/questify-admin-service:latest
    container_name: questify-admin-service
    restart: unless-stopped
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      SPRING_DATASOURCE_USERNAME: ${ADMIN_DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${ADMIN_DB_PASSWORD}
      SPRING_DATASOURCE_DRIVER: org.postgresql.Driver
      SPRING_JPA_DDL_AUTO: update
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_USERNAME: ${RABBITMQ_USER}
      RABBITMQ_PASSWORD: ${RABBITMQ_PASSWORD}
      JWT_PUBLIC_KEY: ${JWT_SECRET}
      AUTH_SERVICE_URL: http://auth-service:8081
      QUEST_SERVICE_URL: http://quest-service:8082
      PROJECT_SERVICE_URL: http://project-service:8083
      PROGRESSION_SERVICE_URL: http://progression-service:8084
      STATS_SERVICE_URL: http://stats-service:8085
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8086/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - questify-network

  gateway:
    image: nginx:alpine
    container_name: questify-gateway
    restart: unless-stopped
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      auth-service:
        condition: service_healthy
      quest-service:
        condition: service_healthy
      project-service:
        condition: service_healthy
      progression-service:
        condition: service_healthy
      stats-service:
        condition: service_healthy
      admin-service:
        condition: service_healthy
    networks:
      - questify-network

  frontend:
    image: axelfrache/questify-frontend:latest
    container_name: questify-frontend
    restart: unless-stopped
    ports:
      - "80:8080"
    depends_on:
      - gateway
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - questify-network

networks:
  questify-network:
    driver: bridge

volumes:
  postgres-data:
  rabbitmq-data:
EOF

echo "Starting Docker containers..."
COMPOSE=()
if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' found."
    exit 1
fi

sudo -E "${COMPOSE[@]}" up -d

echo "=========================================================="
echo "   Questify is successfully installed and starting!       "
echo "=========================================================="
echo "  Frontend URL:  http://$LOCAL_IP"
echo "  Admin Email:   $ADMIN_EMAIL"
echo "  Admin Pass:    $ADMIN_PASS"
echo ""
echo "  (Please SAVE these credentials immediately!)"
echo "=========================================================="
echo "Note: It may take 2-3 minutes for all services to"
echo "fully initialize."
echo "If you use a custom domain, update CORS_ALLOWED_ORIGINS"
echo "in $INSTALL_DIR/.env and run:"
echo "  sudo -E ${COMPOSE[*]} up -d"
echo "=========================================================="
