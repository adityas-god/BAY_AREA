#!/usr/bin/env bash
# ==============================================================================
# BAY AREA™ SOP Hub for GreyOrange — Production VM Deployment Script
# ==============================================================================
set -euo pipefail

echo "=================================================="
echo "🚀 Starting BAY AREA SOP Hub VM Deployment..."
echo "=================================================="

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed on this VM."
    echo "💡 Install Docker with: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 2. Check for Docker Compose
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Docker Compose is not installed on this VM."
    exit 1
fi

# 3. Setup .env from .env.example if not present
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || true
fi

PORT="${HOST_PORT:-8083}"
echo "🌐 Configured Host Port: ${PORT}"

# 4. Build unified frontend on VM if needed
echo "🔨 Building unified frontend on host VM..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

# 5. Build and run containers
echo "📦 Starting containers with ${DOCKER_COMPOSE_CMD}..."
${DOCKER_COMPOSE_CMD} up -d --build --force-recreate

# 6. Wait for service health check
echo "⏳ Verifying service health..."
sleep 4
docker ps --filter "name=bay-area-frontend"
docker image prune -f > /dev/null 2>&1 || true

echo "=================================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "🎯 Container bay-area-frontend is running on port ${PORT}."
echo "🔗 Access URL: http://localhost:${PORT}"
echo "=================================================="
