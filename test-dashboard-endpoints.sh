#!/bin/bash

# Dashboard API Endpoints Test Script
# Run this to verify all dashboard endpoints are working

API_BASE="http://localhost:5001"
echo "🧪 Testing CampusPe Dashboard API Endpoints"
echo "================================================"

# Test health endpoint
echo "1. Testing API Health..."
curl -s "$API_BASE/health" | jq '.message' || echo "❌ Health check failed"

# Test public endpoints (should work without auth)
echo -e "\n2. Testing Public Endpoints..."
echo "   - Colleges public endpoint:"
COLLEGES_COUNT=$(curl -s "$API_BASE/api/colleges/public" | jq 'length')
echo "     Found $COLLEGES_COUNT colleges"

echo "   - Recruiters public endpoint:"  
RECRUITERS_COUNT=$(curl -s "$API_BASE/api/recruiters/public" | jq 'length')
echo "     Found $RECRUITERS_COUNT recruiters"

# Test protected endpoints (will show auth requirement)
echo -e "\n3. Testing Protected Endpoints (should require auth)..."

ENDPOINTS=(
    "/api/students/profile"
    "/api/students/applications" 
    "/api/interviews/student/assignments"
    "/api/interviews/my-interviews"
    "/api/colleges/invitations"
    "/api/notifications"
    "/api/recruiters/profile"
    "/api/recruiters/stats"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "   Testing: $endpoint"
    RESPONSE=$(curl -s "$API_BASE$endpoint")
    if echo "$RESPONSE" | grep -q "No token provided\|Invalid token"; then
        echo "     ✅ Properly requires authentication"
    else
        echo "     ❌ Auth check failed: $RESPONSE"
    fi
done

echo -e "\n4. Testing Web Application..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
if [ "$WEB_STATUS" = "200" ]; then
    echo "   ✅ Web application is running (http://localhost:3000)"
else
    echo "   ❌ Web application not responding"
fi

echo -e "\n================================================"
echo "✅ Dashboard API Test Complete!"
echo ""
echo "🔗 Quick Links:"
echo "   • Connect Page: http://localhost:3000/connect"
echo "   • College Dashboard: http://localhost:3000/dashboard/college"  
echo "   • Student Dashboard: http://localhost:3000/dashboard/student"
echo "   • Recruiter Dashboard: http://localhost:3000/dashboard/recruiter"
echo ""
echo "📝 Note: Dashboard features require user authentication"
echo "   Register/login to test full dashboard functionality"
