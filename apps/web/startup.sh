#!/bin/bash
set -e

# Ensure we run from the script's directory
cd "$(dirname "$0")"

echo "Starting CampusPe Web..."

# Set environment variables for Azure
export PORT="${PORT:-8080}"
export HOST="${HOST:-0.0.0.0}"
export NODE_ENV=production

echo "Environment: PORT=$PORT, HOST=$HOST, NODE_ENV=$NODE_ENV"

# Install dependencies if missing (should not happen in production)
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --only=production
fi

# Check if Next.js build exists (should exist from GitHub Actions build)
if [ ! -d ".next" ]; then
    echo "ERROR: Next.js build not found! Building..."
    npm run build
fi

# Start the application
echo "Starting Node.js application..."
exec node server.js