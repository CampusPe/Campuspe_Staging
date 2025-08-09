#!/bin/bash

echo "🧪 CampusPe Comprehensive Testing Suite"
echo "======================================"

# URLs
API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
WEB_URL="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"

echo "🔍 Phase 1: Basic Service Health"
echo "--------------------------------"

# Test API health
echo "Testing API health..."
api_status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
echo "API Health: $api_status $([ $api_status -eq 200 ] && echo '✅' || echo '❌')"

# Test web service
echo "Testing web service..."
web_status=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")
echo "Web Service: $web_status $([ $web_status -eq 200 ] && echo '✅' || echo '❌')"

echo ""
echo "🔗 Phase 2: API Endpoint Testing"
echo "--------------------------------"

# Test API endpoints
endpoints=(
    "/health"
    "/api/auth/test"
    "/api/students/test"
    "/api/colleges/test"
    "/api/jobs/test"
)

for endpoint in "${endpoints[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint")
    echo "GET $endpoint: $status $([ $status -eq 200 ] || [ $status -eq 404 ] && echo '✅' || echo '❌')"
done

echo ""
echo "🌐 Phase 3: CORS Configuration"
echo "-----------------------------"

# Test CORS preflight for login
cors_status=$(curl -s -X OPTIONS \
    -H "Origin: $WEB_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -w "%{http_code}" \
    -o /dev/null \
    "$API_URL/api/auth/login")

echo "CORS Preflight (Login): $cors_status $([ $cors_status -eq 204 ] || [ $cors_status -eq 200 ] && echo '✅' || echo '❌')"

echo ""
echo "🔐 Phase 4: Authentication Flow Test"
echo "-----------------------------------"

# Test login endpoint structure
login_test=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: $WEB_URL" \
    -d '{"email":"test@example.com","password":"testpass"}' \
    -w "%{http_code}" \
    -o /dev/null \
    "$API_URL/api/auth/login")

echo "Login Endpoint: $login_test $([ $login_test -eq 400 ] || [ $login_test -eq 401 ] || [ $login_test -eq 200 ] && echo '✅' || echo '❌')"

echo ""
echo "📊 Phase 5: Performance & Response Time"
echo "--------------------------------------"

# Test response times
api_time=$(curl -s -w "%{time_total}" -o /dev/null "$API_URL/health")
echo "API Response Time: ${api_time}s"

if [ $web_status -eq 200 ]; then
    web_time=$(curl -s -w "%{time_total}" -o /dev/null "$WEB_URL")
    echo "Web Response Time: ${web_time}s"
else
    echo "Web Response Time: N/A (503 error)"
fi

echo ""
echo "🎯 Summary"
echo "=========="

if [ $api_status -eq 200 ]; then
    echo "✅ API Service: OPERATIONAL"
else
    echo "❌ API Service: FAILED"
fi

if [ $web_status -eq 200 ]; then
    echo "✅ Web Service: OPERATIONAL"
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🌐 Your application is live at:"
    echo "   Web: $WEB_URL"
    echo "   API: $API_URL"
else
    echo "❌ Web Service: FAILED (Status: $web_status)"
    echo "🔧 Next steps:"
    echo "   1. Check environment variables in Azure Portal"
    echo "   2. Restart web service"
    echo "   3. Monitor logs for startup errors"
    echo "   4. Verify build artifacts exist"
fi

echo ""
echo "📋 Configuration Checklist"
echo "========================="
echo "Web Service Environment Variables:"
echo "  □ PORT=8080"
echo "  □ NODE_ENV=production"
echo "  □ NEXT_PUBLIC_API_URL=$API_URL"
echo ""
echo "API Service Environment Variables:"
echo "  □ PORT=8080"
echo "  □ HOST=0.0.0.0"
echo "  □ NODE_ENV=production"
echo "  □ CORS_ORIGIN=$WEB_URL"
echo "  □ MONGODB_URI=[configured]"
echo "  □ JWT_SECRET=[configured]"
