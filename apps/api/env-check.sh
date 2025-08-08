#!/bin/bash

# Environment configuration check for CampusPe API
echo "🔧 CampusPe API Environment Check"
echo "=================================="

# Check required environment variables
echo ""
echo "📋 Environment Variables:"
echo "NODE_ENV: ${NODE_ENV:-'❌ Not set'}"
echo "PORT: ${PORT:-'❌ Not set'}"
echo "HOST: ${HOST:-'❌ Not set'}"
echo "MONGODB_URI: ${MONGODB_URI:+✅ Set}${MONGODB_URI:-❌ Not set}"
echo "CORS_ORIGIN: ${CORS_ORIGIN:+✅ Set}${CORS_ORIGIN:-❌ Not set}"
echo "JWT_SECRET: ${JWT_SECRET:+✅ Set}${JWT_SECRET:-❌ Not set}"

echo ""
echo "🔍 File System Check:"
echo "Working directory: $(pwd)"
echo "package.json exists: $([ -f package.json ] && echo '✅ Yes' || echo '❌ No')"
echo "node_modules exists: $([ -d node_modules ] && echo '✅ Yes' || echo '❌ No')"
echo "dist directory exists: $([ -d dist ] && echo '✅ Yes' || echo '❌ No')"
echo "dist/app.js exists: $([ -f dist/app.js ] && echo '✅ Yes' || echo '❌ No')"

echo ""
echo "🚀 Node.js Info:"
echo "Node version: $(node --version 2>/dev/null || echo '❌ Node not found')"
echo "NPM version: $(npm --version 2>/dev/null || echo '❌ NPM not found')"

echo ""
echo "Ready to start: $([ -f dist/app.js ] && [ -n "$MONGODB_URI" ] && echo '✅ Yes' || echo '❌ No - Missing requirements')"
