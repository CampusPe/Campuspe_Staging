#!/bin/bash

# Get login token
echo "🔐 Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_recruiter@campuspe.com","password":"pppppp"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token using basic text processing
TOKEN=$(echo $LOGIN_RESPONSE | sed 's/.*"token":"\([^"]*\)".*/\1/')

echo "Extracted token: ${TOKEN:0:50}..."

if [ -z "$TOKEN" ] || [ "$TOKEN" = "$LOGIN_RESPONSE" ]; then
    echo "❌ Failed to extract token"
    exit 1
fi

echo ""
echo "🔗 Testing connections endpoint..."
CONNECTIONS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Connections response:"
echo "$CONNECTIONS_RESPONSE"

echo ""
echo "📧 Testing invitations endpoint..."
INVITATIONS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Invitations response:"
echo "$INVITATIONS_RESPONSE"
