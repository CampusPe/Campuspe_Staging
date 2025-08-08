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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci --only=production
else
    echo "✅ Dependencies already installed"
fi

# Build the application if the Next.js build output is missing
if [ ! -d ".next" ]; then
    echo "⚙️ Building Next.js app..."
    npm run build
else
    echo "✅ Build already exists"
fi

# Start the Next.js application
echo "🌐 Starting Next.js application on $HOST:$PORT..."

# Use the custom server for better control
if [ -f "server.js" ]; then
    echo "🚀 Starting with custom server (server.js)"
    exec node server.js
else
    echo "🚀 Starting with Next.js built-in server"
    exec npx next start -p $PORT -H $HOST
fi
