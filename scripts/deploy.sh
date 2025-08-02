#!/bin/bash

# Production deployment script

set -e

PROJECT_DIR="/opt/rocket-cloud-portal/rocket-cloud-portal-backend"
DOCKER_IMAGE="rocket-cloud-portal-backend"

echo "🚀 Starting deployment process..."

# Ensure we're in the correct directory
cd $PROJECT_DIR

# Load environment variables
if [ -f ".env.production" ]; then
    echo "� Loading environment variables..."
    export $(cat .env.production | grep -v '^#' | grep -v '^$' | xargs)
    
    # Construct DATABASE_URL if needed
    if [[ "$DATABASE_URL" == *'${'* ]]; then
        export DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}"
    fi
else
    echo "❌ .env.production file not found"
    exit 1
fi

# Pull latest changes from GitHub
echo "📥 Pulling latest code..."
git pull origin main

# Copy production environment file
echo "⚙️ Setting up environment..."
cp .env.production .env

# Build Docker image locally
echo "🐳 Building Docker image..."
docker build -t $DOCKER_IMAGE .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Start new containers
echo "🚀 Starting new containers..."
docker-compose up -d

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 15

# Health check
echo "🏥 Performing health check..."
for i in {1..10}; do
    if curl -f http://localhost:6001/health >/dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    elif [ $i -eq 10 ]; then
        echo "❌ Health check failed after 10 attempts"
        echo "📋 Container logs:"
        docker-compose logs app
        exit 1
    else
        echo "⏳ Health check attempt $i/10..."
        sleep 5
    fi
done

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

# Show running containers
echo "📊 Current running containers:"
docker-compose ps

echo "✅ Deployment completed successfully!"
echo "🌐 Application is available at:"
echo "   - Local: http://localhost:6001"
echo "   - Health: http://localhost:6001/health"
echo "   - API Docs: http://localhost:6001/api-docs"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker-compose logs -f app"
echo "   - Stop app: docker-compose down"
echo "   - Restart: docker-compose restart"
