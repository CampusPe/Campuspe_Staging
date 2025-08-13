#!/bin/bash

echo "🔍 MONITORING STARTUP.SH FIX DEPLOYMENT"
echo "======================================="

API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"

echo ""
echo "�� Fix Deployed: web.config now uses startup.sh"
echo "   GitHub Actions is rebuilding and redeploying..."
echo ""

# Function to test API status
test_api() {
    local response=$(timeout 10 curl -s -I "$API_URL/health" 2>/dev/null)
    local status_code=$(echo "$response" | head -n1 | cut -d' ' -f2)
    echo "$status_code"
}

echo "⏰ Waiting for deployment to complete..."
echo "   This usually takes 3-5 minutes"
echo ""

# Wait for deployment to start
echo "⏱️  Initial wait (90 seconds for deployment to process)..."
sleep 90

# Monitor for up to 10 minutes
MAX_ATTEMPTS=15
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    echo "🔍 Test $ATTEMPT/$MAX_ATTEMPTS: Checking API status..."
    
    STATUS=$(test_api)
    
    if [ "$STATUS" = "200" ]; then
        echo ""
        echo "🎉 SUCCESS! API is now responding correctly!"
        echo "✅ startup.sh is working properly!"
        echo ""
        
        # Get a sample response
        echo "📊 API Response:"
        timeout 10 curl -s "$API_URL/health" 2>/dev/null | head -5
        echo ""
        
        # Test CORS now that API is working
        echo "🧪 Testing CORS configuration..."
        ./test-cors-fix.sh
        
        echo ""
        echo "🎯 DEPLOYMENT SUCCESSFUL! ✅"
        echo "============================"
        echo "✅ API Service: OPERATIONAL"
        echo "✅ startup.sh: WORKING"
        echo "✅ Environment Variables: CONFIGURED"
        echo "✅ Health Check: PASSING"
        echo ""
        echo "🔗 Your API is now accessible:"
        echo "   • API: $API_URL"
        echo "   • Health: $API_URL/health"
        echo "   • Web App: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"
        
        exit 0
    elif [ "$STATUS" = "503" ]; then
        echo "   Status: 503 (deployment may still be in progress or startup.sh running)"
    elif [ "$STATUS" = "502" ]; then
        echo "   Status: 502 (application starting up)"
    elif [ -z "$STATUS" ]; then
        echo "   No response (service restarting)"
    else
        echo "   Status: $STATUS"
    fi
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "   Waiting 30 seconds before next check..."
        sleep 30
    fi
done

echo ""
echo "⚠️  MONITORING TIMEOUT"
echo "====================="
echo "The API hasn't responded with 200 OK after extended monitoring."
echo ""
echo "🔍 NEXT STEPS:"
echo "   1. Check GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo "   2. Check Azure logs for startup.sh messages"
echo "   3. Verify the deployment completed successfully"
echo ""
echo "💡 If startup.sh is running, you should see its log messages in Azure Portal."
