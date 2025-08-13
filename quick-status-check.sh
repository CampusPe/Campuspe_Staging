#!/bin/bash

echo "🔍 QUICK API STATUS CHECK"
echo "========================"

API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"

echo "Testing API endpoints with timeout..."
echo ""

echo "1. Root endpoint (/):"
timeout 10 curl -s -I "$API_URL/" 2>/dev/null | head -1 || echo "   ❌ No response or timeout"

echo ""
echo "2. Health endpoint (/health):"
timeout 10 curl -s -I "$API_URL/health" 2>/dev/null | head -1 || echo "   ❌ No response or timeout"

echo ""
echo "3. GitHub Actions Status:"
echo "   Check: https://github.com/CampusPe/Campuspe_Staging/actions"

echo ""
echo "4. Azure Portal Links:"
echo "   • API Service: https://portal.azure.com (Search: campuspe-api-staging)"
echo "   • Log Stream: Go to API service → Monitoring → Log stream"

echo ""
echo "🔍 If API is still 503 after 5+ minutes:"
echo "   1. Check GitHub Actions for deployment errors"
echo "   2. Check Azure logs for startup-enhanced.js messages"
echo "   3. Verify environment variables in Azure Portal"
