#!/bin/bash
set -e

# Ensure we run from the script's directory
cd "$(dirname "$0")"

echo "Starting CampusPe API..."

# Set environment variables for Azure
export PORT="${PORT:-8080}"
export HOST="${HOST:-0.0.0.0}"
export NODE_ENV=production

echo "Environment: PORT=$PORT, HOST=$HOST, NODE_ENV=$NODE_ENV"
echo "MongoDB URI configured: ${MONGODB_URI:+Yes}"

# Run environment check if available
if [ -f "env-check.sh" ]; then
    chmod +x env-check.sh
    ./env-check.sh
fi

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci --only=production
else
    echo "✅ Dependencies already installed"
fi

# Build the TypeScript source if dist directory is missing
if [ ! -d "dist" ]; then
    echo "⚙️ Building TypeScript application..."
    npm run build
else
    echo "✅ Build already exists"
fi

# Verify the main app file exists
if [ ! -f "dist/app.js" ]; then
    echo "❌ Built application not found. Rebuilding..."
    npm run build
fi

# Final check before starting
if [ ! -f "dist/app.js" ]; then
    echo "❌ FATAL: Could not find dist/app.js after build"
    exit 1
fi

if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  WARNING: MONGODB_URI not set, app may fail to connect to database"
fi

# Start the application
echo "🚀 Starting Node.js API server on $HOST:$PORT..."
exec node dist/app.js
