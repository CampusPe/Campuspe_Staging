#!/bin/bash

echo "🧪 Testing CampusPe API Endpoints"
echo "================================="

# Test health endpoint
echo "1. Testing API Health:"
curl -s http://localhost:5001/health | head -5
echo ""

# Test login endpoint with invalid credentials (should return proper error, not 500)
echo "2. Testing Login Endpoint (with test credentials):"
response=$(curl -s -w "HTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}')

http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

echo "   HTTP Status: $http_code"
echo "   Response: $body"
echo ""

# Test jobs endpoint
echo "3. Testing Jobs Endpoint:"
jobs_response=$(curl -s -w "HTTP_CODE:%{http_code}" http://localhost:5001/api/jobs)
jobs_http_code=$(echo "$jobs_response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
jobs_body=$(echo "$jobs_response" | sed 's/HTTP_CODE:[0-9]*$//')

echo "   HTTP Status: $jobs_http_code"
echo "   Response: $(echo "$jobs_body" | head -3)"
echo ""

if [ "$http_code" = "500" ]; then
    echo "❌ Login endpoint returning 500 error - needs investigation"
else
    echo "✅ Login endpoint responding properly (not 500)"
fi

if [ "$jobs_http_code" = "200" ]; then
    echo "✅ Jobs endpoint working"
else
    echo "⚠️  Jobs endpoint status: $jobs_http_code"
fi

echo ""
echo "🌐 Frontend should now be accessible at:"
echo "   http://localhost:3000"
echo ""
echo "🔧 If login still shows 500 errors in browser:"
echo "   1. Check browser network tab for exact error"
echo "   2. Check API server logs for detailed error messages"
echo "   3. Verify MongoDB connection is working"
