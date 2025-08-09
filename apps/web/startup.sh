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

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --include=dev
fi

# Ensure Next.js build exists
if [ ! -d ".next" ]; then
    echo "Next.js build not found! Installing dependencies and building..."
    npm install --include=dev
    npm run build
fi

# Start the application
echo "Starting Next.js application..."
exec npm start
