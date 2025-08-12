#!/bin/bash

echo "🧪 CORS Fix Testing Script"
echo "========================="

API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
WEB_ORIGIN="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"

echo ""
echo "🔍 Testing CORS configuration..."
echo ""

echo "1. Testing OPTIONS preflight request:"
echo "-----------------------------------"
response=$(curl -s -H "Origin: $WEB_ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -X OPTIONS \
  "$API_URL/api/colleges" \
  -I)

echo "$response"

if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ SUCCESS: CORS headers are present!"
    echo ""
    
    echo "2. Testing actual API request:"
    echo "-----------------------------"
    actual_response=$(curl -s -H "Origin: $WEB_ORIGIN" \
      -H "Content-Type: application/json" \
      "$API_URL/api/colleges" \
      -w "Status: %{http_code}")
    
    echo "$actual_response"
    echo ""
    echo "�� CORS IS FIXED! Frontend should now work properly."
    
else
    echo "❌ FAILED: No CORS headers found"
    echo ""
    echo "🚨 ACTION REQUIRED:"
    echo "1. Set CORS_ORIGIN environment variable in Azure Portal"
    echo "2. Restart the API service"
    echo "3. Run this test again"
    echo ""
    echo "Environment variable to set:"
    echo "CORS_ORIGIN = $WEB_ORIGIN"
fi

echo ""
echo "🔗 Quick links:"
echo "- Azure Portal: https://portal.azure.com"
echo "- API Service: App Services → campuspe-api-staging"
echo "- Web Service: $WEB_ORIGIN"

