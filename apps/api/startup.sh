#!/bin/bash
set -e

# Azure App Service startup script for CampusPe API
echo "=== CampusPe API Service Startup ==="

# Ensure we run from the script's directory
cd "$(dirname "$0")"

# Set environment variables for Azure
export PORT="${PORT:-8080}"
export HOST="${HOST:-0.0.0.0}"
export NODE_ENV=production

echo "Environment: PORT=$PORT, HOST=$HOST, NODE_ENV=$NODE_ENV"
echo "Working directory: $(pwd)"
echo "Process: PID=$$, Node=$(node --version)"

# Check for required files
echo "Checking required files..."
echo "dist directory: $([ -d "dist" ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "package.json: $([ -f "package.json" ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "dist/app.js: $([ -f "dist/app.js" ] && echo "✅ EXISTS" || echo "❌ MISSING")"

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "Installing production dependencies..."
    npm install --only=production
else
    echo "Dependencies already installed"
fi

# Check if build exists
if [ ! -d "dist" ] || [ ! -f "dist/app.js" ]; then
    echo "❌ Build artifacts not found! This is a critical error."
    echo "The build should have been created during deployment."
    exit 1
else
    echo "✅ Build artifacts found"
fi

# Start the application
echo "Starting CampusPe API Application..."
echo "Using dist/app.js"

# Use exec to replace the shell process
exec node dist/app.js
