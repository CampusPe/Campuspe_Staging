#!/bin/bash

echo "🔧 WABB WhatsApp Integration - CORRECT Configuration"
echo "=================================================="
echo ""

echo "📋 Azure App Service Environment Variables to Set:"
echo ""
echo "1️⃣ WABB_WEBHOOK_URL (for error messages & user not found):"
echo "   Value: https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/"
echo ""
echo "2️⃣ WABB_WEBHOOK_URL_RESUME (for successful resume sharing):"
echo "   Value: https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/"
echo ""
echo "3️⃣ API_BASE_URL (for download links):"
echo "   Value: https://campuspe-api-staging.azurewebsites.net"
echo ""
echo "4️⃣ WABB_API_KEY:"
echo "   Value: your-actual-wabb-api-key"
echo ""

echo "🎯 How This Works:"
echo ""
echo "📥 Step 1: WhatsApp user sends request to your API:"
echo "   POST → https://campuspe-api-staging.azurewebsites.net/api/wabb/generate-and-share"
echo ""
echo "🔄 Step 2a: If user EXISTS in CampusPe database:"
echo "   → AI generates resume"
echo "   → PDF created and uploaded"
echo "   → Resume sent via: ORlQYXvg8qk9 webhook"
echo "   → User receives PDF on WhatsApp"
echo ""
echo "⚠️ Step 2b: If user NOT FOUND or ERROR:"
echo "   → Error message sent via: HJGMsTitkl8a webhook"
echo "   → User gets registration/error message on WhatsApp"
echo ""

echo "🧪 Test Command (after Azure config update):"
echo ""
echo 'curl -X POST https://campuspe-api-staging.azurewebsites.net/api/wabb/generate-and-share \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{'
echo '    \"name\": \"Test User\",'
echo '    \"email\": \"test@campuspe.com\",'
echo '    \"phone\": \"919156621088\",'
echo '    \"jobDescription\": \"Looking for a React developer\"'
echo '  }"'
echo ""

echo "✅ After setting these in Azure Portal:"
echo "1. App Services → campuspe-api-staging"
echo "2. Configuration → Application settings"
echo "3. Update the 4 environment variables above"
echo "4. Save & Restart"
echo "5. Test with the curl command"
