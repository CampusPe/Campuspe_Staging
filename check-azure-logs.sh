#!/bin/bash

echo "🔍 AZURE DIAGNOSTIC INVESTIGATION"
echo "================================="

echo ""
echo "🚨 STATUS: API still returning 503 after Node.js fix"
echo "   This indicates a deeper application startup issue"
echo ""

echo "📋 POSSIBLE CAUSES:"
echo "   1. Missing environment variables (MONGODB_URI, JWT_SECRET)"
echo "   2. Application code errors during startup"
echo "   3. Dependencies not properly installed"
echo "   4. Azure App Service configuration issues"
echo ""

echo "🔍 Let's check what we can diagnose locally:"

echo ""
echo "1️⃣ Checking if server.js was created correctly:"
if [ -f "apps/api/server.js" ]; then
    echo "✅ server.js exists"
    echo "   File size: $(stat -f%z apps/api/server.js 2>/dev/null || stat -c%s apps/api/server.js 2>/dev/null || echo "unknown") bytes"
else
    echo "❌ server.js missing!"
fi

echo ""
echo "2️⃣ Checking web.config:"
if [ -f "apps/api/web.config" ]; then
    echo "✅ web.config exists"
    if grep -q "server.js" apps/api/web.config; then
        echo "✅ web.config points to server.js"
    else
        echo "❌ web.config doesn't reference server.js"
    fi
else
    echo "❌ web.config missing!"
fi

echo ""
echo "3️⃣ Checking package.json:"
if [ -f "apps/api/package.json" ]; then
    echo "✅ package.json exists"
    echo "Main entry point: $(grep '"main"' apps/api/package.json || echo "Not found")"
    echo "Start script: $(grep '"start"' apps/api/package.json || echo "Not found")"
else
    echo "❌ package.json missing!"
fi

echo ""
echo "4️⃣ Checking dist/app.js:"
if [ -f "apps/api/dist/app.js" ]; then
    echo "✅ dist/app.js exists"
    echo "   File size: $(stat -f%z apps/api/dist/app.js 2>/dev/null || stat -c%s apps/api/dist/app.js 2>/dev/null || echo "unknown") bytes"
    
    # Check if the app.js file has listen() call
    if grep -q "listen" apps/api/dist/app.js; then
        echo "✅ dist/app.js contains listen() call"
    else
        echo "⚠️  dist/app.js might not have listen() call"
    fi
else
    echo "❌ dist/app.js missing - this could be the problem!"
fi

echo ""
echo "5️⃣ Testing server.js locally (quick test):"
echo "Attempting to run server.js locally to see if it works..."

cd apps/api

# Set some basic environment variables for local testing
export PORT=3001
export NODE_ENV=production
export MONGODB_URI="mongodb://localhost:27017/test"  # Dummy for testing
export JWT_SECRET="test-secret"

echo "Running: node server.js (will timeout in 10 seconds)"
timeout 10 node server.js 2>&1 | head -20 || echo "Local test completed/timed out"

cd ../..

echo ""
echo "🔗 NEXT STEPS:"
echo "   1. If dist/app.js is missing → Build issue"
echo "   2. If local test fails → Application code issue"  
echo "   3. If local test works → Azure environment issue"
echo "   4. Check Azure Portal logs for detailed error messages"

echo ""
echo "💡 AZURE DIAGNOSTIC ACCESS:"
echo "   Visit: https://campuspe-api-staging-hmfjgud5c6a7exe9.scm.southindia-01.azurewebsites.net/"
echo "   → Debug console → CMD → Navigate to site/wwwroot"
echo "   → Or check LogFiles for detailed error logs"
