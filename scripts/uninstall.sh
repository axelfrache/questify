#!/bin/bash
set -euo pipefail

echo "=========================================================="
echo "          Questify Stack Uninstallation Script            "
echo "=========================================================="
echo "WARNING: This script will completely remove Questify."
echo "It will stop all containers and delete the installation directory."

INSTALL_DIR="/opt/questify"

# User confirmation
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

read -p "Do you also want to delete all application data (database, S3 files)? This CANNOT be undone! (y/N): " -n 1 -r
echo
REMOVE_DATA=0
if [[ $REPLY =~ ^[Yy]$ ]]; then
    REMOVE_DATA=1
fi

# Verify permissions
if ! command -v sudo >/dev/null 2>&1; then 
    echo "Error: 'sudo' is required."
    exit 1
fi

# Authenticate sudo early
sudo -v
# Keep sudo session active
( while true; do sudo -n true; sleep 60; kill -0 "$$" || exit 0; done ) 2>/dev/null &

if [ -d "$INSTALL_DIR" ]; then
    echo "Found Questify installation at $INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    COMPOSE=()
    if docker compose version >/dev/null 2>&1; then
        COMPOSE=(docker compose)
    elif command -v docker-compose >/dev/null 2>&1; then
        COMPOSE=(docker-compose)
    else
        echo "Warning: Docker Compose not found. Cannot stop containers gracefully."
    fi

    if [ ${#COMPOSE[@]} -gt 0 ] && [ -f "docker-compose.yml" ]; then
        if [ "$REMOVE_DATA" -eq 1 ]; then
            echo "Removing containers, networks, and ALL data volumes..."
            sudo -E "${COMPOSE[@]}" down -v
        else
            echo "Removing containers and networks (keeping database volumes)..."
            sudo -E "${COMPOSE[@]}" down
            echo "Note: PostgreSQL and RabbitMQ volumes are preserved."
            echo "Note: Garage S3 data (bind mount) will be removed with the installation directory."
        fi
    fi

    # Prevent "device or resource busy" error by leaving directory
    cd /

    echo "Removing installation directory ($INSTALL_DIR)..."
    sudo rm -rf "$INSTALL_DIR"
else
    echo "Installation directory $INSTALL_DIR not found."
    echo "No files were removed."
fi

echo "=========================================================="
echo "   ✅ Questify has been successfully uninstalled.         "
echo "=========================================================="
