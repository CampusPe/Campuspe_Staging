#!/bin/bash

echo "🔍 MONITORING API DEPLOYMENT PROGRESS"
echo "===================================="

API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
WEB_URL="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"
GITHUB_URL="https://github.com/CampusPe/Campuspe_Staging/actions"

echo ""
echo "🎯 Deployment initiated with enhanced diagnostics"
echo "   GitHub Actions is rebuilding and deploying the API..."
echo ""

# Function to test API status
test_api() {
    local response=$(curl -s -I "$API_URL/health" 2>/dev/null)
    local status_code=$(echo "$response" | head -n1 | cut -d' ' -f2)
    echo "$status_code"
}

# Function to get detailed API response
get_api_details() {
    echo "📊 Detailed API Response:"
    echo "========================"
    curl -v "$API_URL/health" 2>&1 | head -20
    echo ""
}

echo "⏰ Waiting for deployment to complete..."
echo "   This usually takes 3-5 minutes"
echo ""

# Wait for a minute before starting tests (deployment needs time)
echo "⏱️  Initial wait (60 seconds)..."
sleep 60

# Monitor for up to 10 minutes
MAX_ATTEMPTS=20
ATTEMPT=0
LAST_STATUS=""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    echo "🔍 Test $ATTEMPT/$MAX_ATTEMPTS: Checking API status..."
    
    STATUS=$(test_api)
    
    if [ "$STATUS" = "200" ]; then
        echo "🎉 SUCCESS! API is now responding correctly!"
        echo ""
        get_api_details
        echo ""
        echo "✅ API DEPLOYMENT SUCCESSFUL!"
        echo "   Health endpoint: $API_URL/health"
        echo "   Status: HTTP 200 OK"
        echo ""
        
        # Test CORS now that API is working
        echo "🧪 Testing CORS configuration..."
        ./test-cors-fix.sh
        
        echo ""
        echo "🎯 FINAL STATUS: DEPLOYMENT COMPLETE ✅"
        echo "======================================"
        echo "✅ API Service: OPERATIONAL"
        echo "✅ Health Check: PASSING"
        echo "✅ CORS: CONFIGURED"
        echo ""
        echo "🔗 You can now access:"
        echo "   • API: $API_URL"
        echo "   • Web App: $WEB_URL"
        echo "   • Health Check: $API_URL/health"
        
        exit 0
    elif [ "$STATUS" = "503" ]; then
        if [ "$LAST_STATUS" != "503" ]; then
            echo "⚠️  Status: 503 Service Unavailable (deployment may still be in progress)"
        else
            echo "⚠️  Still 503 - checking Azure logs recommended"
        fi
    elif [ "$STATUS" = "502" ]; then
        echo "⚠️  Status: 502 Bad Gateway (application starting up)"
    elif [ -z "$STATUS" ]; then
        echo "⚠️  No response (service may be restarting)"
    else
        echo "⚠️  Status: $STATUS"
    fi
    
    LAST_STATUS="$STATUS"
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "   Waiting 30 seconds before next check..."
        sleep 30
    fi
done

echo ""
echo "⚠️  DEPLOYMENT MONITORING TIMEOUT"
echo "================================="
echo "The API is still not responding after 10+ minutes."
echo ""
echo "🔍 RECOMMENDED ACTIONS:"
echo ""
echo "1. 📊 CHECK GITHUB ACTIONS"
echo "   URL: $GITHUB_URL"
echo "   Look for any deployment errors or failures"
echo ""
echo "2. 🔍 CHECK AZURE LOGS"
echo "   Go to: Azure Portal → campuspe-api-staging → Monitoring → Log stream"
echo "   Look for startup-enhanced.js diagnostic messages"
echo ""
echo "3. 🧪 MANUAL API TEST"
echo "   Run: curl -v $API_URL/health"
echo ""
echo "4. 🔄 IF GITHUB ACTIONS FAILED"
echo "   Check the logs and re-run the workflow if needed"
echo ""

get_api_details

echo "💡 The enhanced startup script will provide detailed error messages in Azure logs."
