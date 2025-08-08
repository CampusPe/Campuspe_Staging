#!/bin/bash
set -e

# Ensure we run from the script's directory
cd "$(dirname "$0")"

echo "Starting CampusPe Web..."

# Azure exposes port 8080 for Node apps
PORT="${PORT:-8080}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --prefer-offline
else
    echo "✅ Dependencies already installed"
fi

# Build the application if the Next.js build output is missing
if [ ! -d ".next" ]; then
    echo "⚙️ Building Next.js app..."
    npm run build
fi

# Start the Next.js application
echo "🌐 Starting Next.js application..."
export NODE_ENV=production
# Azure uses port 8080 for Linux web apps
export PORT=${PORT:-8080}
export HOST=${HOST:-0.0.0.0}

# Try to start with npm start, fallback to node server.js
if [ -f "package.json" ] && npm run start --if-present; then
    echo "✅ Started with npm start"
elif [ -f "server.js" ]; then
    echo "🔄 Fallback: Starting with node server.js"
    node server.js
else
    echo "🔄 Fallback: Starting with npx next start"
    npx next start -p $PORT -H $HOST
fi
