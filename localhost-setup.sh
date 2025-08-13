#!/bin/bash

echo "🚀 CampusPe Localhost Development Setup"
echo "====================================="

# Check Node.js and npm versions
echo "📋 System Requirements Check:"
node_version=$(node --version)
npm_version=$(npm --version)
echo "   Node.js: $node_version"
echo "   npm: $npm_version"

if [[ $(echo $node_version | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    echo "❌ Error: Node.js version 20 or higher required"
    exit 1
fi

echo "✅ System requirements met"

# Ensure all dependencies are installed
echo ""
echo "📦 Installing Dependencies:"
echo "   Installing root dependencies..."
npm install

echo "   Installing API dependencies..."
cd apps/api && npm install && cd ../..

echo "   Installing Web dependencies..."
cd apps/web && npm install && cd ../..

echo "✅ All dependencies installed"

# Check environment files
echo ""
echo "🔧 Environment Configuration:"
if [ -f "apps/api/.env.local" ]; then
    echo "   ✅ API .env.local exists"
else
    echo "   ❌ API .env.local missing - please run the setup again"
fi

if [ -f "apps/web/.env.local" ]; then
    echo "   ✅ Web .env.local exists"
else
    echo "   ❌ Web .env.local missing - please run the setup again"
fi

# Build API if needed
echo ""
echo "🔨 Building API:"
cd apps/api
if [ ! -f "dist/app.js" ]; then
    echo "   Building TypeScript to JavaScript..."
    npm run build
else
    echo "   ✅ API already built"
fi
cd ../..

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "🚀 To start development:"
echo "   Option 1 (Both together): npm run dev"
echo "   Option 2 (Separate):"
echo "     Terminal 1: npm run dev:api    # Backend on http://localhost:5001"
echo "     Terminal 2: npm run dev:web    # Frontend on http://localhost:3000"
echo ""
echo "📋 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5001"
echo "   API Health: http://localhost:5001/health"
echo ""
