#!/bin/bash
set -e

echo "=== Preparing CampusPe API for Azure Deployment ==="

# Ensure we're in the API directory
cd /Users/ankitalokhande/Desktop/Campuspe_Staging/apps/api

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist node_modules package-lock.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building TypeScript application..."
npm run build

# Verify the build
echo "✅ Verifying build..."
if [ ! -f "dist/app.js" ]; then
    echo "❌ Build failed - dist/app.js not found"
    exit 1
fi

# Check file sizes
echo "📊 Build statistics:"
echo "  - Total files in dist: $(find dist -type f | wc -l)"
echo "  - Main app size: $(ls -lh dist/app.js | awk '{print $5}')"
echo "  - Total dist size: $(du -sh dist | awk '{print $1}')"

# Test startup
echo "🧪 Testing application startup..."
PORT=5998 timeout 5s node dist/app.js &
PID=$!
sleep 3

if kill -0 $PID 2>/dev/null; then
    echo "✅ Application starts successfully"
    kill $PID
    wait $PID 2>/dev/null || true
else
    echo "❌ Application failed to start"
    exit 1
fi

echo "🎉 API is ready for Azure deployment!"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes"
echo "2. Deploy to Azure App Service"
echo "3. Set environment variables in Azure"
echo ""
echo "Key files for deployment:"
echo "  - package.json (with postinstall script)"
echo "  - web.config (IIS configuration)"
echo "  - dist/ (compiled TypeScript)"
