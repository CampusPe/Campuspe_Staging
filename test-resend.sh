#!/bin/bash

# Get login token
echo "🔐 Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_recruiter@campuspe.com","password":"pppppp"}')

TOKEN=$(echo $LOGIN_RESPONSE | sed 's/.*"token":"\([^"]*\)".*/\1/')

echo "✅ Login successful"

# Test resend invitation with the known invitation ID
INVITATION_ID="689f0e1b7aec28aed6f8eb2a"

echo ""
echo "📧 Testing invitation resend functionality..."
echo "Invitation ID: $INVITATION_ID"

RESEND_RESPONSE=$(curl -s -X POST http://localhost:5001/api/invitations/$INVITATION_ID/resend \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Resend response:"
echo "$RESEND_RESPONSE"
