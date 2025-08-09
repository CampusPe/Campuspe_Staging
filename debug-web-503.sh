#!/bin/bash

echo "🚨 CampusPe Web Service 503 Debug Analysis"
echo "=========================================="

WEB_URL="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"

echo "📊 Detailed Web Service Analysis..."
echo "Web URL: $WEB_URL"
echo ""

# Test with detailed response headers
echo "🔍 Getting detailed HTTP response..."
curl -v "$WEB_URL" 2>&1 | head -20

echo ""
echo "🔍 Testing specific endpoints..."

# Test favicon (common indicator)
echo "Testing favicon..."
curl -s -o /dev/null -w "Favicon Status: %{http_code}\n" "$WEB_URL/favicon.ico"

# Test with different methods
echo "Testing with HEAD request..."
curl -s -I "$WEB_URL" | head -5

echo ""
echo "🔧 Possible Root Causes for 503 Error:"
echo "1. ❌ Missing environment variables (NEXT_PUBLIC_API_URL)"
echo "2. ❌ Build artifacts not present (.next directory missing)"
echo "3. ❌ Node.js process crashed during startup"
echo "4. ❌ Port configuration issues"
echo "5. ❌ Memory/resource limitations"
echo ""

echo "🛠️  IMMEDIATE ACTIONS NEEDED:"
echo ""
echo "1. Check Azure Portal Logs:"
echo "   Azure Portal → campuspe-web-staging → Monitoring → Log Stream"
echo ""
echo "2. Set Required Environment Variables:"
echo "   Azure Portal → campuspe-web-staging → Configuration → Application Settings"
echo "   Add: PORT=8080"
echo "   Add: NODE_ENV=production" 
echo "   Add: NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
echo ""
echo "3. Check Deployment Status:"
echo "   Azure Portal → campuspe-web-staging → Deployment Center"
echo "   Verify last deployment was successful"
echo ""
echo "4. Restart Service:"
echo "   Azure Portal → campuspe-web-staging → Overview → Restart"
echo ""

# Test API to confirm it's working
echo "✅ Verifying API is still working..."
API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
curl -s -o /dev/null -w "API Status: %{http_code}\n" "$API_URL/health"

echo ""
echo "🎯 Next Steps Priority:"
echo "1. FIRST: Add environment variables in Azure Portal"
echo "2. SECOND: Restart the web service"
echo "3. THIRD: Wait 5 minutes for full startup"
echo "4. FOURTH: Check logs if still failing"
