#!/bin/bash

# Quick Fix Deployment Script for Azure API
# This script will deploy the fixed version immediately

set -e

echo "🚀 Quick Fix Deployment for CampusPe API"
echo "========================================"

API_APP_NAME="campuspe-api-staging-hmfjgud5c6a7exe9"
RESOURCE_GROUP="campuspe-staging-rg"

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "❌ Please login to Azure first:"
    echo "   az login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Navigate to API directory
cd "$(dirname "$0")/apps/api"

echo "📁 Current directory: $(pwd)"

# Build application
echo "🔨 Building application with fixes..."
npm run build

# Verify critical files exist
echo "🔍 Verifying build output..."
MISSING_FILES=()

if [ ! -f "server.js" ]; then
    MISSING_FILES+=("server.js")
fi

if [ ! -f "dist/app.js" ]; then
    MISSING_FILES+=("dist/app.js")
fi

if [ ! -f "dist/routes/wabb-debug.js" ]; then
    MISSING_FILES+=("dist/routes/wabb-debug.js")
fi

if [ ! -f "web.config" ]; then
    MISSING_FILES+=("web.config")
fi

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    echo "❌ Missing critical files:"
    printf '%s\n' "${MISSING_FILES[@]}"
    exit 1
fi

echo "✅ All critical files present"

# Create deployment package
echo "📦 Creating deployment package..."
rm -f deployment.zip

# Create a clean deployment package excluding unnecessary files
zip -r deployment.zip . \
    -x "node_modules/@types/*" \
    -x "node_modules/typescript/*" \
    -x "node_modules/ts-node/*" \
    -x "node_modules/nodemon/*" \
    -x "node_modules/eslint/*" \
    -x "node_modules/jest/*" \
    -x "node_modules/@typescript-eslint/*" \
    -x "src/*" \
    -x "*.log" \
    -x ".git/*" \
    -x ".env"

PACKAGE_SIZE=$(du -h deployment.zip | cut -f1)
echo "📦 Package size: $PACKAGE_SIZE"

# Deploy to Azure
echo "🚀 Deploying to Azure App Service..."
az webapp deploy \
    --resource-group "$RESOURCE_GROUP" \
    --name "$API_APP_NAME" \
    --src-path deployment.zip \
    --type zip

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    
    # Restart the app service to ensure clean startup
    echo "🔄 Restarting App Service..."
    az webapp restart --resource-group "$RESOURCE_GROUP" --name "$API_APP_NAME"
    
    # Wait for restart
    echo "⏳ Waiting for service to restart..."
    sleep 15
    
    # Test the deployment
    echo "🧪 Testing deployed API..."
    API_URL="https://${API_APP_NAME}.southindia-01.azurewebsites.net"
    
    # Test health endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" --max-time 30 || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ API is responding correctly!"
        echo "🌐 API URL: $API_URL"
        echo "🏥 Health Check: $API_URL/health"
        
        # Test a few more endpoints
        echo ""
        echo "🔍 Testing additional endpoints:"
        
        ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/" --max-time 10 || echo "000")
        echo "Root endpoint (/): $ROOT_STATUS"
        
        API_HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" --max-time 10 || echo "000")
        echo "API Health endpoint (/api/health): $API_HEALTH_STATUS"
        
    else
        echo "⚠️  API returned status code: $HTTP_STATUS"
        echo "📋 Checking deployment logs..."
        
        # Get recent logs
        echo "📄 Recent application logs:"
        az webapp log tail --resource-group "$RESOURCE_GROUP" --name "$API_APP_NAME" --provider application | head -20
    fi
    
    # Cleanup
    rm -f deployment.zip
    
else
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "🎉 Deployment process completed!"
echo ""
echo "📋 If still having issues:"
echo "1. Check Azure Portal → App Services → $API_APP_NAME → Log stream"
echo "2. Check Deployment Center for deployment history"
echo "3. Verify environment variables are set correctly"
