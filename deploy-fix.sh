#!/bin/bash

echo "🚀 CampusPe Azure Deployment Fix Script"
echo "======================================="

echo "📋 What this script will do:"
echo "1. Fix web.config files to use startup.sh"
echo "2. Update startup scripts with better error handling"
echo "3. Fix GitHub Actions workflows"
echo "4. Commit and push changes to trigger deployment"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the root of your CampusPe project"
    exit 1
fi

echo "✅ Verified project root directory"

# Check git status
echo ""
echo "📊 Current git status:"
git status --porcelain

echo ""
echo "🔧 Changes made:"
echo "✅ Updated apps/web/web.config to use startup.sh"
echo "✅ Updated apps/api/web.config to use startup.sh"  
echo "✅ Enhanced startup.sh scripts with better logging"
echo "✅ Fixed GitHub Actions workflows"

echo ""
echo "🚀 Ready to deploy! The following will happen:"
echo "1. Commit the configuration fixes"
echo "2. Push to main branch"
echo "3. Trigger Azure deployment via GitHub Actions"
echo "4. Both services should start properly"

echo ""
read -p "Do you want to commit and deploy these fixes? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📝 Committing changes..."
    
    git add .
    git commit -m "🔧 Fix Azure deployment configuration

- Update web.config files to use startup.sh instead of direct node files
- Enhance startup scripts with better logging and error handling
- Fix GitHub Actions workflows to include all required files
- Ensure proper file permissions for startup scripts

This should resolve the 503 errors by properly configuring Azure App Service startup commands."

    echo ""
    echo "🚀 Pushing to main branch..."
    git push origin main
    
    echo ""
    echo "✅ Deployment triggered!"
    echo ""
    echo "📊 Monitor the deployment:"
    echo "1. GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
    echo "2. Azure Portal Web Logs: App Services → campuspe-web-staging → Log stream"
    echo "3. Azure Portal API Logs: App Services → campuspe-api-staging → Log stream"
    echo ""
    echo "⏱️  Expected deployment time: 5-10 minutes"
    echo ""
    echo "🧪 Test deployment after completion:"
    echo "   ./comprehensive-test.sh"
    
else
    echo ""
    echo "❌ Deployment cancelled. Changes are ready but not committed."
    echo "   Run this script again when ready to deploy."
fi

echo ""
echo "📋 Configuration Summary:"
echo "================================="
echo "✅ Web Service Configuration:"
echo "   - Startup: startup.sh → server-azure-debug.js"
echo "   - Port: 8080"
echo "   - Environment: production"
echo "   - API URL: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
echo ""
echo "✅ API Service Configuration:"
echo "   - Startup: startup.sh → dist/app.js"
echo "   - Port: 8080"
echo "   - Host: 0.0.0.0"
echo "   - CORS: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"
