#!/bin/bash

echo "🧪 Testing Resume Analysis API"
echo "==============================="

# Create a simple test PDF content
echo "Creating test resume content..."

# Get admin token for testing
echo "🔑 Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@campuspe.com","password":"admin123","role":"admin"}' \
  http://localhost:5001/api/auth/login)

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Got authentication token: ${TOKEN:0:20}..."

# Test the endpoint first to see if it's accessible
echo ""
echo "📡 Testing endpoint accessibility..."
TEST_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/students/analyze-resume-ai)

echo "Response: $TEST_RESPONSE"

if [[ $TEST_RESPONSE == *"No resume file uploaded"* ]]; then
  echo "✅ Endpoint is accessible and responding correctly"
else
  echo "❌ Unexpected response from endpoint"
  exit 1
fi

echo ""
echo "🎯 Resume analysis endpoint is ready!"
echo ""
echo "📋 To test with actual PDF:"
echo "1. Use the frontend at http://localhost:3000"
echo "2. Login as student or admin"
echo "3. Upload a PDF resume"
echo "4. The system will use enhanced fallback analysis (since Claude API key is placeholder)"
echo ""
echo "🔧 To enable full Claude AI analysis:"
echo "1. Get API key from https://console.anthropic.com/"
echo "2. Replace placeholder in apps/api/.env.local"
echo "3. Restart the API server"
