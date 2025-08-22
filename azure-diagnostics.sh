#!/bin/bash

# Azure Deployment Diagnostics and Fix Script
# This script will help diagnose and fix the 503 error on Azure

echo "🔍 CampusPe Azure Deployment Diagnostics"
echo "========================================"

API_APP_NAME="campuspe-api-staging-hmfjgud5c6a7exe9"
RESOURCE_GROUP="campuspe-staging-rg"
API_URL="https://${API_APP_NAME}.southindia-01.azurewebsites.net"

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -n "Testing $description ($endpoint)... "
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 10 || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ OK ($HTTP_STATUS)"
        return 0
    else
        echo "❌ FAILED ($HTTP_STATUS)"
        return 1
    fi
}

# Test multiple endpoints
echo "🧪 Testing API Endpoints:"
echo "------------------------"

test_endpoint "$API_URL" "Root endpoint"
test_endpoint "$API_URL/health" "Health endpoint"
test_endpoint "$API_URL/api/health" "API Health endpoint"

echo ""
echo "🔧 Diagnostic Steps:"
echo "-------------------"

echo "1. ✅ Local server works (confirmed in previous tests)"
echo "2. ❌ Azure deployment returning 503 errors"
echo "3. 📋 Possible causes:"
echo "   - Azure didn't pick up latest git push"
echo "   - Build failed during Azure deployment"
echo "   - Environment variables missing"
echo "   - App Service configuration issues"

echo ""
echo "🚀 Fix Steps:"
echo "-------------"

echo "Step 1: Login to Azure CLI"
echo "az login"
echo ""

echo "Step 2: Check deployment status"
echo "az webapp deployment list --resource-group $RESOURCE_GROUP --name $API_APP_NAME --output table"
echo ""

echo "Step 3: Check app service logs"
echo "az webapp log tail --resource-group $RESOURCE_GROUP --name $API_APP_NAME"
echo ""

echo "Step 4: Force redeploy with our fixes"
echo "cd /Users/ankitalokhande/Desktop/Campuspe_Staging/apps/api"
echo "npm run build"
echo "zip -r deployment.zip . -x node_modules/\\* .git/\\* *.log"
echo "az webapp deploy --resource-group $RESOURCE_GROUP --name $API_APP_NAME --src-path deployment.zip --type zip"
echo ""

echo "Step 5: Restart the app service"
echo "az webapp restart --resource-group $RESOURCE_GROUP --name $API_APP_NAME"
echo ""

echo "Step 6: Test after deployment"
echo "curl $API_URL/health"
echo ""

echo "🔗 Useful Azure Portal Links:"
echo "-----------------------------"
echo "App Service: https://portal.azure.com/#@/resource/subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$API_APP_NAME"
echo "Deployment Center: https://portal.azure.com/#@/resource/subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$API_APP_NAME/deploymentcenter"
echo "Log Stream: https://portal.azure.com/#@/resource/subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$API_APP_NAME/logStream"
echo ""

echo "💡 Alternative: Manual deployment via Azure Portal"
echo "1. Go to Azure Portal → App Services → $API_APP_NAME"
echo "2. Go to Deployment Center"
echo "3. Check deployment history"
echo "4. If needed, disconnect and reconnect GitHub integration"
echo "5. Or use 'Local Git' and push manually"
