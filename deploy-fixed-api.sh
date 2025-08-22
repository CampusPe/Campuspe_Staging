#!/bin/bash

# Quick Azure Deployment Script for Fixed API
# Run this after logging in to Azure CLI

set -e

echo "🚀 Deploying Fixed CampusPe API to Azure..."

# Azure App Service details
API_APP_NAME="campuspe-api-staging-hmfjgud5c6a7exe9"
RESOURCE_GROUP="campuspe-staging-rg"

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "❌ Please login to Azure first:"
    echo "   az login"
    exit 1
fi

# Navigate to API directory
cd "$(dirname "$0")/apps/api"

echo "📁 Current directory: $(pwd)"

# Ensure we have the latest build with our fixes
echo "🔨 Building application..."
npm run build

# Verify our fix is in place
if [ ! -f "dist/routes/wabb-debug.js" ]; then
    echo "❌ Missing wabb-debug.js file. Running manual copy..."
    cp src/routes/wabb-debug.js dist/routes/wabb-debug.js
fi

echo "✅ Build verification complete"

# Deploy to Azure
echo "🚀 Deploying to Azure App Service..."
az webapp deploy \
    --resource-group "$RESOURCE_GROUP" \
    --name "$API_APP_NAME" \
    --src-path "." \
    --type zip

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    
    # Wait a moment for deployment to propagate
    echo "⏳ Waiting for deployment to propagate..."
    sleep 10
    
    # Test the deployed API
    echo "🧪 Testing deployed API..."
    API_URL="https://${API_APP_NAME}.southindia-01.azurewebsites.net"
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ API is responding correctly!"
        echo "🌐 API URL: $API_URL"
        echo "🏥 Health Check: $API_URL/health"
    else
        echo "⚠️  API returned status code: $HTTP_STATUS"
        echo "💡 Check Azure App Service logs for more details"
        echo "📊 Logs: https://portal.azure.com -> $API_APP_NAME -> Log stream"
    fi
else
    echo "❌ Deployment failed"
    exit 1
fi

echo "🎉 Deployment process completed!"
