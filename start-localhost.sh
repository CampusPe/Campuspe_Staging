#!/bin/bash

# CampusPe Localhost Development Runner
# This script starts both API and Web servers for local development

echo "🚀 Starting CampusPe Localhost Development Environment"
echo "===================================================="

# Check if we're in the right directory
if [ ! -d "apps/api" ] || [ ! -d "apps/web" ]; then
    echo "❌ Error: Please run this script from the root of the CampusPe_Staging directory"
    exit 1
fi

# Verify environment files exist
echo "🔍 Checking environment configuration..."

if [ ! -f "apps/api/.env.local" ]; then
    echo "❌ API .env.local missing. Running setup..."
    ./localhost-setup.sh
fi

if [ ! -f "apps/web/.env.local" ]; then
    echo "❌ Web .env.local missing. Running setup..."
    ./localhost-setup.sh
fi

echo "✅ Environment files ready"

# Display configuration
echo ""
echo "📋 Current Configuration:"
echo "   • Frontend:  http://localhost:3000"
echo "   • Backend:   http://localhost:5001"  
echo "   • API Health: http://localhost:5001/health"
echo "   • Database:  Cloud MongoDB (configured)"
echo ""

# Check if ports are available
echo "🔍 Checking port availability..."

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use (Web server port)"
    echo "   You may need to stop the existing process first"
fi

if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 5001 is already in use (API server port)"
    echo "   You may need to stop the existing process first"
fi

echo ""
echo "🎯 Starting development servers..."
echo "   This will start both API (port 5001) and Web (port 3000) servers"
echo "   Press Ctrl+C to stop both servers"
echo ""

# Start both servers using the root package.json script
npm run dev
