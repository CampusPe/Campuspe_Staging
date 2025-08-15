#!/bin/bash

echo "🔍 COMPREHENSIVE CONNECTIONS SYSTEM ANALYSIS"
echo "=============================================="

# Test login first
echo -e "\n1. Testing Authentication..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_recruiter@campuspe.com","password":"pppppp"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    echo "Trying to create test recruiter account..."
    
    # Try admin login as fallback
    ADMIN_LOGIN=$(curl -s -X POST http://localhost:5001/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@campuspe.com","password":"admin123"}')
    
    echo "Admin login response: $ADMIN_LOGIN"
    TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ No valid authentication token available"
    exit 1
fi

echo "✅ Authentication successful"
echo "Token: ${TOKEN:0:50}..."

# Test connections endpoint
echo -e "\n2. Testing Connections Endpoint..."
CONNECTIONS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Connections response:"
echo "$CONNECTIONS_RESPONSE"

# Test connections endpoint with verbose error info
echo -e "\n3. Testing with detailed error information..."
CONNECTIONS_VERBOSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X GET http://localhost:5001/api/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Detailed response: $CONNECTIONS_VERBOSE"

# Test health endpoint
echo -e "\n4. Testing API Health..."
HEALTH_RESPONSE=$(curl -s http://localhost:5001/health)
echo "Health: $HEALTH_RESPONSE"
