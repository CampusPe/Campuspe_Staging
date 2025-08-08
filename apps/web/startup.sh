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


PORT="${PORT:-8080}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --prefer-offline

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
    echo "✅ Build already exists"
fi

# Start the Next.js application
echo "🌐 Starting Next.js application on $HOST:$PORT..."

# Use the custom server for better control
if [ -f "server.js" ]; then
    echo "� Starting with custom server (server.js)"
    exec node server.js

else
    echo "� Starting with Next.js built-in server"
    exec npx next start -p $PORT -H $HOST
fi
