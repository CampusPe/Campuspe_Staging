#!/bin/bash
set -e

echo "🚀 CampusPe API - Azure Deployment Script"
echo "========================================"

# Navigate to API directory
cd "$DEPLOYMENT_TARGET" || cd "/home/site/wwwroot"

echo "📁 Current directory: $(pwd)"
echo "📋 Directory contents:"
ls -la

# Check if we're in a monorepo structure
if [ -d "apps/api" ]; then
    echo "🔍 Detected monorepo structure, navigating to apps/api"
    cd apps/api
else
    echo "🔍 Using current directory as API root"
fi

echo "📁 API directory: $(pwd)"
echo "📋 API directory contents:"
ls -la

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Install dev dependencies needed for build
echo "🔧 Installing dev dependencies for build..."
npm install --only=dev

# Build TypeScript
echo "🏗️ Building TypeScript..."
npm run build

echo "📋 Build output:"
ls -la dist/

# Clean up dev dependencies to reduce size
echo "🧹 Cleaning up dev dependencies..."
npm prune --production

echo "✅ Deployment completed successfully!"
echo "🎯 Entry point: dist/app.js"

# Test if the built app.js exists
if [ -f "dist/app.js" ]; then
    echo "✅ dist/app.js found - ready to start"
else
    echo "❌ dist/app.js not found - build may have failed"
    exit 1
fi
