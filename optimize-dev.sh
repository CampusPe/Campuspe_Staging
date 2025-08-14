#!/bin/bash

# CampusPe Development Optimization Script
echo "🚀 Starting CampusPe Development Server with Optimizations..."

# Set development environment variables for better performance
export NODE_ENV=development
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=8192"

# Clear Next.js cache for fresh start
echo "🧹 Clearing Next.js cache..."
cd apps/web
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server with optimizations
echo "🌟 Starting optimized development server on port 3000..."
npm run dev

echo "✅ Development server started! Open http://localhost:3000"
