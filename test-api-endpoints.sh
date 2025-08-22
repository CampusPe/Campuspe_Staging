#!/bin/bash

# API Endpoint Testing Script
# Tests all critical endpoints to verify deployment

API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"

echo "🧪 Testing CampusPe API Endpoints"
echo "================================"
echo "Base URL: $API_URL"
echo ""

# Function to test endpoint with detailed output
test_endpoint_detailed() {
    local endpoint=$1
    local description=$2
    
    echo "Testing: $description"
    echo "URL: $endpoint"
    echo -n "Status: "
    
    # Get both status code and response
    RESPONSE=$(curl -s -w "\n%{http_code}" "$endpoint" --max-time 15)
    STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$STATUS_CODE" = "200" ]; then
        echo "✅ $STATUS_CODE (OK)"
        if [ -n "$RESPONSE_BODY" ]; then
            echo "Response: $(echo "$RESPONSE_BODY" | head -c 200)..."
        fi
    elif [ "$STATUS_CODE" = "503" ]; then
        echo "❌ $STATUS_CODE (Service Unavailable)"
        echo "Issue: Application not starting properly"
    elif [ "$STATUS_CODE" = "404" ]; then
        echo "⚠️  $STATUS_CODE (Not Found)"
        echo "Issue: Endpoint may not exist or routing problem"
    elif [ "$STATUS_CODE" = "000" ]; then
        echo "❌ Connection failed (timeout/unreachable)"
        echo "Issue: Service completely down"
    else
        echo "⚠️  $STATUS_CODE (Unexpected)"
        if [ -n "$RESPONSE_BODY" ]; then
            echo "Response: $(echo "$RESPONSE_BODY" | head -c 200)..."
        fi
    fi
    echo "---"
}

# Test critical endpoints
test_endpoint_detailed "$API_URL/" "Root endpoint"
test_endpoint_detailed "$API_URL/health" "Health check"
test_endpoint_detailed "$API_URL/api/health" "API Health check"
test_endpoint_detailed "$API_URL/api/debug" "Debug endpoint"

echo ""
echo "📊 Summary:"
echo "----------"

# Quick status check
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/" --max-time 10 || echo "000")
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" --max-time 10 || echo "000")
API_HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" --max-time 10 || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ API is working correctly!"
elif [ "$API_HEALTH_STATUS" = "200" ]; then
    echo "⚠️  API is partially working (some endpoints OK)"
elif [ "$ROOT_STATUS" = "503" ] || [ "$HEALTH_STATUS" = "503" ] || [ "$API_HEALTH_STATUS" = "503" ]; then
    echo "❌ Service Unavailable (503) - Application startup issue"
    echo ""
    echo "🔧 Recommended fixes:"
    echo "1. Check application logs in Azure Portal"
    echo "2. Verify environment variables"
    echo "3. Redeploy with fixed build"
    echo "4. Restart the App Service"
else
    echo "❌ API is not responding correctly"
    echo ""
    echo "🔧 Possible issues:"
    echo "1. Deployment failed"
    echo "2. Configuration problems"
    echo "3. Environment variable issues"
    echo "4. Build or startup errors"
fi

echo ""
echo "🔗 Azure Portal links:"
echo "App Service: https://portal.azure.com → Search for 'campuspe-api-staging-hmfjgud5c6a7exe9'"
echo "Log Stream: App Service → Monitoring → Log stream"
echo "Deployment Center: App Service → Deployment → Deployment Center"
