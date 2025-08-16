#!/bin/bash

echo "🔧 CampusPe Azure Environment Setup & Testing Script"
echo "=================================================="

# Test if API is responding
echo ""
echo "1. Testing API Health..."
echo "🔍 Checking: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/health"

API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/health" || echo "000")

if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API is responding (HTTP $API_RESPONSE)"
else
    echo "❌ API is not responding (HTTP $API_RESPONSE)"
    echo "   Check Azure Portal → campuspe-api-staging → Log stream"
fi

# Test if Web App is responding
echo ""
echo "2. Testing Web App..."
echo "🔍 Checking: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"

WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net" || echo "000")

if [ "$WEB_RESPONSE" = "200" ]; then
    echo "✅ Web App is responding (HTTP $WEB_RESPONSE)"
else
    echo "❌ Web App is not responding (HTTP $WEB_RESPONSE)"
    echo "   Check Azure Portal → campuspe-web-staging → Log stream"
fi

echo ""
echo "3. Required Azure Environment Variables"
echo "======================================="
echo ""
echo "🌐 For campuspe-web-staging:"
echo "----------------------------"
echo "NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
echo "PORT=8080"
echo "NODE_ENV=production"
echo "WEBSITES_ENABLE_APP_SERVICE_STORAGE=false"
echo "WEBSITE_RUN_FROM_PACKAGE=1"
echo "NEXT_TELEMETRY_DISABLED=1"
echo ""
echo "🔧 For campuspe-api-staging:"
echo "----------------------------"
echo "PORT=8080"
echo "NODE_ENV=production"
echo "MONGODB_URI=<your-mongodb-connection-string>"
echo "JWT_SECRET=<your-jwt-secret>"
echo "WEBSITES_ENABLE_APP_SERVICE_STORAGE=false"
echo "CORS_ORIGIN=https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net,http://localhost:3000"
echo ""
echo "📋 How to set environment variables:"
echo "1. Go to Azure Portal"
echo "2. Navigate to App Services → [app-name]"
echo "3. Go to Configuration → Application Settings"
echo "4. Click 'New application setting'"
echo "5. Add each variable above"
echo "6. Click 'Save' at the top"
echo "7. The app will restart automatically"
echo ""
echo "🚨 Critical: Make sure both apps are deployed successfully!"
echo "   Check GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo ""

# Test CORS directly
echo "4. Testing CORS..."
echo "🔍 Testing CORS preflight request..."

CORS_TEST=$(curl -s -X OPTIONS \
  -H "Origin: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -o /dev/null -w "%{http_code}" \
  "https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/connections" || echo "000")

if [ "$CORS_TEST" = "200" ] || [ "$CORS_TEST" = "204" ]; then
    echo "✅ CORS preflight is working (HTTP $CORS_TEST)"
else
    echo "❌ CORS preflight failed (HTTP $CORS_TEST)"
    echo "   This might indicate API is not running or CORS not configured"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. If API is not responding, check deployment in GitHub Actions"
echo "2. Set the environment variables above in Azure Portal"
echo "3. Restart both web apps after setting variables"
echo "4. Test again using this script"
echo ""
