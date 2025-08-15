#!/bin/bash

echo "🔍 COMPREHENSIVE FRONTEND-BACKEND CONNECTIONS FLOW TEST"
echo "======================================================="

# Test 1: Check if servers are running
echo -e "\n1. Checking server status..."
API_HEALTH=$(curl -s http://localhost:5001/health)
if [ $? -eq 0 ]; then
    echo "✅ API Server: Running"
    echo "   Response: $API_HEALTH"
else
    echo "❌ API Server: Not running"
fi

WEB_HEALTH=$(curl -s http://localhost:3000 | head -n 1)
if [ $? -eq 0 ]; then
    echo "✅ Web Server: Running"
else
    echo "❌ Web Server: Not running"
fi

# Test 2: Test unauthenticated connections request (this should fail gracefully)
echo -e "\n2. Testing unauthenticated connections request..."
UNAUTH_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X GET http://localhost:5001/api/connections \
  -H "Content-Type: application/json")
echo "Unauthenticated response: $UNAUTH_RESPONSE"

# Test 3: Test with invalid token (this should fail gracefully)  
echo -e "\n3. Testing with invalid token..."
INVALID_TOKEN_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X GET http://localhost:5001/api/connections \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json")
echo "Invalid token response: $INVALID_TOKEN_RESPONSE"

# Test 4: Test with null token (this might be the issue)
echo -e "\n4. Testing with null token..."
NULL_TOKEN_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X GET http://localhost:5001/api/connections \
  -H "Authorization: Bearer null" \
  -H "Content-Type: application/json")
echo "Null token response: $NULL_TOKEN_RESPONSE"

# Test 5: Test proper authentication flow
echo -e "\n5. Testing proper authentication flow..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_recruiter@campuspe.com","password":"pppppp"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Login successful"
    echo "Token: ${TOKEN:0:50}..."
    
    # Test authenticated connections request
    CONNECTIONS_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X GET http://localhost:5001/api/connections \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    echo "Authenticated connections response: $CONNECTIONS_RESPONSE"
else
    echo "❌ Login failed"
    echo "Response: $LOGIN_RESPONSE"
fi

echo -e "\n6. Summary and Recommendations:"
echo "=============================================="
echo "If you see 500 errors above, the issue is likely:"
echo "- Frontend sending 'null' or invalid tokens"
echo "- Authentication middleware not handling edge cases"
echo "- Missing error handling in connections route"
