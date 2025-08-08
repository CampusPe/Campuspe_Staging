#!/bin/bash

# Quick verification script for the current issues
echo "🔍 Verifying Current Azure Issues..."

echo ""
echo "🌐 Testing Web App API Configuration..."
echo "Expected: Web app should call Azure API, not localhost"

# Test if the web app is still calling localhost
WEB_RESPONSE=$(curl -s "https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net/login" | grep -i "localhost:5001" && echo "FOUND" || echo "NOT_FOUND")

if [ "$WEB_RESPONSE" = "FOUND" ]; then
    echo "❌ Web app is still configured to call localhost:5001"
    echo "   → Fix: Update NEXT_PUBLIC_API_URL to include https://"
else
    echo "✅ Web app API configuration appears correct"
fi

echo ""
echo "🔧 Testing API Service Status..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health" 2>/dev/null)

if [ "$API_HEALTH" = "200" ]; then
    echo "✅ API service is running correctly"
elif [ "$API_HEALTH" = "000" ]; then
    echo "❌ API service is not responding (Application Error)"
    echo "   → Check Azure logs and MongoDB connection"
else
    echo "⚠️  API service responding with HTTP $API_HEALTH"
fi

echo ""
echo "🎯 Quick Fix Summary:"
echo "1. Fix NEXT_PUBLIC_API_URL: Add 'https://' prefix"
echo "2. Check API service logs if showing Application Error"
echo "3. Verify MongoDB connection string"
echo ""
echo "See URGENT_FIX_GUIDE.md for detailed steps"
