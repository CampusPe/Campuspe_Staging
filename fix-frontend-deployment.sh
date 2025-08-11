#!/bin/bash

echo "🚀 Emergency Frontend Deployment Fix Script"
echo "==========================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "apps/web" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Test build locally first
echo ""
echo "📦 Testing local build..."
cd apps/web

if npm run build; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed. Fix build errors before deploying."
    exit 1
fi

cd ../..

# Check if all required files exist
echo ""
echo "🔍 Checking deployment files..."

REQUIRED_FILES=(
    "apps/web/package.json"
    "apps/web/next.config.js"
    "apps/web/server-azure.js"
    "apps/web/startup.js"
    "apps/web/web.config"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "⚠️  Warning: Some deployment files are missing:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "The deployment may still work, but these files are recommended."
fi

# Commit and push changes
echo ""
echo "�� Committing workflow fixes..."

git add .github/workflows/main_campuspe-web-staging.yml
git add fix-frontend-deployment.sh

if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    git commit -m "🔧 Fix frontend deployment workflow

- Improved build verification
- Better error handling
- Optimized deployment package
- Added production-only dependencies"
    
    echo ""
    echo "🚀 Pushing changes to trigger deployment..."
    git push origin main
fi

echo ""
echo "✅ DEPLOYMENT FIX COMPLETE!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. ⏰ Wait 2-3 minutes for GitHub Actions to start"
echo "2. 🔍 Monitor: https://github.com/CampusPe/Campuspe_Staging/actions"
echo "3. 🌐 Test: https://campuspe-web-staging.azurewebsites.net"
echo ""
echo "🚨 CRITICAL: Set these environment variables in Azure Portal:"
echo "   Portal → App Services → campuspe-web-staging → Configuration"
echo ""
echo "   PORT = 8080"
echo "   NODE_ENV = production"
echo "   NEXT_PUBLIC_API_URL = https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
echo "   WEBSITES_ENABLE_APP_SERVICE_STORAGE = false"
echo "   WEBSITE_RUN_FROM_PACKAGE = 1"
echo "   NEXT_TELEMETRY_DISABLED = 1"
echo ""
echo "📞 If issues persist, run: ./comprehensive-test.sh"
