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

# Check required commands
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
# Ensure sudo is authenticated early
sudo -v
# Keep sudo alive in the background
( while true; do sudo -n true; sleep 60; kill -0 "$$" || exit 0; done ) 2>/dev/null &

# Check or install Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    
    echo "=========================================================="
    echo "Docker installed. You may need to run the following command"
    echo "to use Docker without sudo in the future:"
    echo "  sudo usermod -aG docker \$USER"
    echo "=========================================================="
else
    echo "Docker is already installed."
fi

# Verify Docker Compose plugin
if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
    echo "Error: Docker Compose is not installed."
    echo "Please install the docker-compose-plugin:"
    echo "  Debian/Ubuntu: sudo apt install docker-compose-plugin"
    echo "  Fedora:        sudo dnf install docker-compose-plugin"
    echo "  Arch Linux:    sudo pacman -S docker-compose"
    exit 1
fi

# Setup installation directory
INSTALL_DIR="/opt/questify"
echo "Setting up Questify in $INSTALL_DIR..."
sudo mkdir -p "$INSTALL_DIR"
sudo chown "$USER:$USER" "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Determine local IP for CORS configuration
LOCAL_IP="$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.' | head -n1 || true)"
LOCAL_IP="${LOCAL_IP:-localhost}"
echo "Detected local IP: $LOCAL_IP"
echo "Note: If you plan to use a domain name (e.g., https://questify.example.com) or access via a public IP,"
echo "you will need to update CORS_ALLOWED_ORIGINS in the .env file later."

# Handle secure credentials
if [ -f .env ]; then
    echo "Existing .env found. Restoring credentials to prevent database lockouts..."
    BACKUP_FILE=".env.bak.$(date +%Y%m%d-%H%M%S)"
    cp .env "$BACKUP_FILE"
    chmod 600 "$BACKUP_FILE" || true
    
    # Temporarily source the existing .env to extract current secrets
    set -a
    source .env
    set +a
    
    DB_PASS=${POSTGRES_PASSWORD:-$(openssl rand -hex 24)}
    MINIO_PASS=${MINIO_ROOT_PASSWORD:-$(openssl rand -hex 24)}
    JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}
    ADMIN_PASS=${QUESTIFY_ADMIN_PASSWORD:-$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 16 || echo -n "admin1234Secure")}
    ADMIN_EMAIL=${QUESTIFY_ADMIN_EMAIL:-"admin@questify.local"}
else
    echo "Generating secure secrets..."
    DB_PASS=$(openssl rand -hex 24)
    MINIO_PASS=$(openssl rand -hex 24)
    JWT_SECRET=$(openssl rand -hex 32)
    ADMIN_PASS=$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 16 || echo -n "admin1234Secure")
    ADMIN_EMAIL="admin@questify.local"
fi

# Create .env config
echo "Creating .env configuration..."
cat <<EOF > .env
# PostgreSQL Configuration
POSTGRES_DB=questify
POSTGRES_USER=questify
POSTGRES_PASSWORD=$DB_PASS

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$MINIO_PASS
MINIO_PUBLIC_BUCKET=false

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# Admin Configuration
QUESTIFY_ADMIN_EMAIL=$ADMIN_EMAIL
QUESTIFY_ADMIN_PASSWORD=$ADMIN_PASS

# Web Configuration
# Update this with your actual domain when deploying to production!
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost,http://127.0.0.1:8081,http://127.0.0.1,http://$LOCAL_IP:8081,http://$LOCAL_IP,https://$LOCAL_IP
COOKIE_SECURE=false
H2_CONSOLE_ENABLED=false

# Rate Limiting
LOGIN_RATE_LIMIT_IP=10
LOGIN_RATE_LIMIT_EMAIL=5
REGISTER_RATE_LIMIT_IP=3
REFRESH_RATE_LIMIT_IP=30
EOF

chmod 600 .env

# Generate Docker Compose file
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
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U questify -d questify" ]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - questify-network

  backend:
    image: axelfrache/questify-backend:latest
    container_name: questify-backend
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
    env_file:
      - .env
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
      - SPRING_DATASOURCE_DRIVER=org.postgresql.Driver
      - SPRING_JPA_DDL_AUTO=update
      - H2_CONSOLE_ENABLED=false
      - QUESTIFY_COOKIE_SECURE=${COOKIE_SECURE}
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=${MINIO_ROOT_USER}
      - S3_SECRET_KEY=${MINIO_ROOT_PASSWORD}
      - S3_BUCKET=questify-profiles
      - S3_REGION=us-east-1
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
    healthcheck:
      test: [ "CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/actuator/health || exit 1" ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - questify-network

  frontend:
    image: axelfrache/questify-frontend:latest
    container_name: questify-frontend
    restart: unless-stopped
    ports:
      - "8081:80"
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: [ "CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1" ]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - questify-network

  minio:
    image: minio/minio:latest
    container_name: questify-minio
    restart: unless-stopped
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    volumes:
      - minio-data:/data
    healthcheck:
      test: [ "CMD", "curl", "-f", "http://localhost:9000/minio/health/live" ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - questify-network

  create-bucket:
    image: minio/mc:latest
    container_name: questify-create-bucket
    depends_on:
      minio:
        condition: service_healthy
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_PUBLIC_BUCKET: ${MINIO_PUBLIC_BUCKET:-false}
    entrypoint: >
      /bin/sh -c "
      echo 'Waiting for MinIO to be ready...';
      for i in 1 2 3 4 5 6 7 8 9 10; do
        if mc alias set myminio http://minio:9000 $${MINIO_ROOT_USER} $${MINIO_ROOT_PASSWORD}; then
          break;
        fi;
        echo 'MinIO not ready yet, retrying in 2s...';
        sleep 2;
      done;
      mc mb myminio/questify-profiles --ignore-existing;
      if [ \"$${MINIO_PUBLIC_BUCKET}\" = \"true\" ]; then
        mc anonymous set download myminio/questify-profiles;
      fi;
      exit 0;
      "
    networks:
      - questify-network

networks:
  questify-network:
    driver: bridge

volumes:
  postgres-data:
  minio-data:
EOF

# Start services
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

# Output summary
echo "=========================================================="
echo "   🎉 Questify is successfully installed and starting!    "
echo "=========================================================="
echo "  Frontend URL:  http://$LOCAL_IP:8081"
echo "  Admin Email:   $ADMIN_EMAIL"
echo "  Admin Pass:    $ADMIN_PASS"
echo ""
echo "  (Please SAVE these credentials immediately!)"
echo "=========================================================="
echo "Note: It may take 1-2 minutes for the database and backend"
echo "to fully initialize."
echo "If you use a custom domain or expose MinIO publicly, update"
echo "CORS_ALLOWED_ORIGINS and MINIO_PUBLIC_BUCKET in $INSTALL_DIR/.env"
echo "and run: sudo -E ${COMPOSE[*]} up -d"
echo "=========================================================="
