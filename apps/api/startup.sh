#!/bin/bash
set -e

# Azure App Service startup script for CampusPe API
echo "=== CampusPe API Service Startup ==="

# Azure typically deploys to /home/site/wwwroot
# But our structure has the API in apps/api
if [ -d "/home/site/wwwroot/apps/api" ]; then
    cd /home/site/wwwroot/apps/api
    echo "Found monorepo structure, using apps/api directory"
elif [ -d "/home/site/wwwroot" ]; then
    cd /home/site/wwwroot
    echo "Using root directory"
else
    # Fallback for local development
    cd "$(dirname "$0")"
    echo "Using script directory for local development"
fi

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

# List current directory contents for debugging
echo "Current directory contents:"
ls -la

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "Installing production dependencies..."
    npm install --only=production
else
    echo "Dependencies already installed"
fi

# Check if build exists, try to build if not
if [ ! -d "dist" ] || [ ! -f "dist/app.js" ]; then
    echo "Build artifacts not found. Attempting to build..."
    if [ -f "tsconfig.json" ] && [ -d "src" ]; then
        echo "Found TypeScript source, building..."
        npm run build
    else
        echo "❌ No TypeScript source found. Cannot build."
        echo "Available files:"
        ls -la
        exit 1
    fi
fi

# Verify build after attempt
if [ ! -f "dist/app.js" ]; then
    echo "❌ Build failed or dist/app.js not found!"
    echo "dist directory contents:"
    ls -la dist/ || echo "dist directory doesn't exist"
    exit 1
else
    echo "✅ Build artifacts found"
fi

# Start the application
echo "Starting CampusPe API Application..."
echo "Using dist/app.js"

# For Azure Linux App Service, we need to keep the process running
# Use node directly without exec to ensure proper signal handling
node dist/app.js
