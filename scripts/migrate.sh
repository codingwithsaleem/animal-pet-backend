#!/bin/bash

# Database migration script for production deployment

set -e

echo "🚀 Starting database migration..."

# Load environment variables from .env.production
if [ -f ".env.production" ]; then
    echo "📁 Loading environment variables from .env.production..."
    export $(cat .env.production | grep -v '^#' | grep -v '^$' | xargs)

    # Construct DATABASE_URL if not fully formed
    if [[ "$DATABASE_URL" == *'${'* ]]; then
        echo "🔧 Constructing DATABASE_URL from components..."
        export DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}"
    fi

    echo "✅ Environment variables loaded"
    echo "🔗 DATABASE_URL: ${DATABASE_URL:0:50}..." # Show first 50 chars for confirmation
else
    echo "❌ .env.production file not found"
    exit 1
fi

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    env | grep -E "(DATABASE|POSTGRES)" || echo "No DB-related environment variables found"
    exit 1
fi

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."

    if ! command -v pnpm &> /dev/null; then
        echo "📥 Installing pnpm globally..."
        sudo npm install -g pnpm
    fi

    pnpm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check DB connection using --url
echo "📊 Checking database connection..."
echo "SELECT 1;" | npx prisma db execute --stdin --url "$DATABASE_URL" || {
    echo "❌ Cannot connect to database"
    echo "🔍 Checking connection details:"
    echo "   Host: $POSTGRES_HOST"
    echo "   Port: $POSTGRES_PORT"
    echo "   DB:   $POSTGRES_DATABASE"
    exit 1
}

# Apply database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Database migration completed successfully!"
