#!/bin/bash

echo "🚀 Azure Deployment Validation Script"
echo "======================================"

API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"

echo "⏳ Waiting 2 minutes for deployment to complete..."
sleep 120

echo ""
echo "1️⃣ Testing API Health Endpoint..."
HEALTH_RESPONSE=$(curl -s "${API_URL}/api/health" || echo "ERROR")

if [[ $HEALTH_RESPONSE == *"status"* ]]; then
    echo "✅ API Health: WORKING"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ API Health: FAILED"
    echo "   Response: $HEALTH_RESPONSE"
fi

echo ""
echo "2️⃣ Testing WABB Health Endpoint..."
WABB_HEALTH=$(curl -s "${API_URL}/api/wabb/health" || echo "ERROR")

if [[ $WABB_HEALTH == *"WABB Resume Service"* ]]; then
    echo "✅ WABB Health: WORKING"
else
    echo "❌ WABB Health: FAILED"
    echo "   Response: $WABB_HEALTH"
fi

echo ""
echo "3️⃣ Testing WhatsApp Generate-and-Share..."
GENERATE_RESPONSE=$(curl -s -X POST "${API_URL}/api/wabb/generate-and-share" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@campuspe.com", 
    "phone": "919156621088",
    "jobDescription": "Looking for a React developer"
  }' || echo "ERROR")

if [[ $GENERATE_RESPONSE == *"Student profile not found"* ]]; then
    echo "✅ Generate-and-Share: WORKING (User not found - triggers registration webhook)"
    echo "   This should send webhook to: HJGMsTitkl8a"
elif [[ $GENERATE_RESPONSE == *"success"* ]]; then
    echo "✅ Generate-and-Share: WORKING (Resume generated)"
else
    echo "❌ Generate-and-Share: FAILED"
    echo "   Response: $GENERATE_RESPONSE"
fi

echo ""
echo "4️⃣ Checking Environment Variables..."
if [[ $WABB_HEALTH == *"ORlQYXvg8qk9"* ]]; then
    echo "✅ WABB Webhooks: Configured correctly"
else
    echo "⚠️  WABB Webhooks: Check configuration in Azure Portal"
fi

echo ""
echo "📋 Summary:"
echo "- API Base URL: $API_URL"
echo "- WABB Resume Webhook: https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/"
echo "- WABB Error Webhook: https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/"
echo ""
echo "🎯 If all tests pass, your WhatsApp integration is ready!"
echo "📱 Test with WABB.in by sending requests to: ${API_URL}/api/wabb/generate-and-share"
