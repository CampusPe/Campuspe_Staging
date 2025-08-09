#!/bin/bash

echo "🔍 CampusPe Azure Deployment Verification"
echo "========================================"

# API Service Check
echo "📡 Testing API Service..."
API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
echo "API URL: $API_URL"

# Test API health
echo "Testing API health endpoint..."
curl -s -o /dev/null -w "API Health Status: %{http_code}\n" "$API_URL/health" || echo "API Health: FAILED"

# Test API root endpoint
echo "Testing API root endpoint..."
curl -s -o /dev/null -w "API Root Status: %{http_code}\n" "$API_URL/" || echo "API Root: FAILED"

echo ""

# Web Service Check
echo "🌐 Testing Web Service..."
WEB_URL="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"
echo "Web URL: $WEB_URL"

# Test web app
echo "Testing web application..."
curl -s -o /dev/null -w "Web App Status: %{http_code}\n" "$WEB_URL" || echo "Web App: FAILED"

echo ""

# CORS Test
echo "🔗 Testing CORS Configuration..."
echo "Checking if web app can reach API..."

# Test CORS preflight
curl -s -X OPTIONS \
  -H "Origin: $WEB_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -w "CORS Preflight Status: %{http_code}\n" \
  -o /dev/null \
  "$API_URL/api/auth/login" || echo "CORS Preflight: FAILED"

echo ""
echo "✅ Verification complete!"
echo ""
echo "🛠️  If any tests failed, check:"
echo "1. Environment variables are set correctly"
echo "2. Both services are running"
echo "3. CORS_ORIGIN includes the exact web URL"
echo "4. NEXT_PUBLIC_API_URL points to the correct API URL"
