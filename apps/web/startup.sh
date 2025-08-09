#!/bin/bash
set -e

# Azure App Service startup script for CampusPe Web
echo "=== CampusPe Web Service Startup ==="

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
echo ".next directory: $([ -d ".next" ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "package.json: $([ -f "package.json" ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "server-azure-debug.js: $([ -f "server-azure-debug.js" ] && echo "✅ EXISTS" || echo "❌ MISSING")"

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --only=production
else
    echo "Dependencies already installed"
fi

# Ensure Next.js build exists
if [ ! -d ".next" ]; then
    echo "❌ Next.js build not found! This is a critical error."
    echo "The build should have been created during deployment."
    exit 1
else
    echo "✅ Next.js build found"
fi

# Start the application
echo "Starting CampusPe Web Application..."
echo "Using server-azure-debug.js for enhanced logging"

# Use exec to replace the shell process
exec node server-azure-debug.js
