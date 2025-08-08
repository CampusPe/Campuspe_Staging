#!/bin/bash

echo "=== CAMPUSPE WEB DEPLOYMENT DIAGNOSTICS ==="
echo "Date: $(date)"
echo ""

echo "1. Testing Web Application Health:"
WEB_URL="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"
echo "URL: $WEB_URL"

# Test main page
echo "Testing main page..."
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" 2>/dev/null)
echo "Main page status: $MAIN_STATUS"

# Test login page
echo "Testing login page..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL/login" 2>/dev/null)
echo "Login page status: $LOGIN_STATUS"

# Test if it's serving any content at all
echo "Testing if server responds..."
RESPONSE_HEADERS=$(curl -I -s "$WEB_URL" 2>/dev/null | head -5)
echo "Response headers:"
echo "$RESPONSE_HEADERS"

echo ""
echo "2. Comparing with working API:"
API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null)
echo "API health status: $API_HEALTH (should be 200)"

echo ""
echo "3. GitHub Actions Deployment Status:"
# Check latest commit
LATEST_COMMIT=$(git log --oneline -1)
echo "Latest commit: $LATEST_COMMIT"

echo ""
echo "4. Checking deployment files exist:"
echo "server-azure.js exists: $([ -f apps/web/server-azure.js ] && echo 'YES' || echo 'NO')"
echo "package.json start script: $(grep '"start"' apps/web/package.json)"
echo "web.config entry point: $(grep 'server-azure.js' apps/web/web.config | head -1)"

echo ""
echo "=== DIAGNOSIS COMPLETE ==="
echo ""
echo "RECOMMENDATIONS:"
if [ "$MAIN_STATUS" = "503" ]; then
    echo "❌ 503 Service Unavailable - Server not starting correctly"
    echo "   → Check Azure App Service logs for startup errors"
    echo "   → Verify Node.js runtime version (should be 20-lts)"
    echo "   → Confirm startup command is set correctly"
elif [ "$MAIN_STATUS" = "200" ]; then
    echo "✅ Web application is working!"
else
    echo "⚠️  Unexpected status: $MAIN_STATUS"
fi
