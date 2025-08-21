# Fixed Azure Environment Variables for WhatsApp Integration

echo "🔧 Fixing WABB WhatsApp Integration Configuration..."

# The issue: WABB_WEBHOOK_URL is pointing to your own API instead of WABB.in
# Current (WRONG): https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/webhook/whatsapp
# Correct: https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/

echo "📋 Set these environment variables in your Azure App Service:"
echo ""
echo "1️⃣ WABB Webhook URL (for sending messages TO WhatsApp users):"
echo "WABB_WEBHOOK_URL=https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/"
echo ""
echo "2️⃣ WABB Resume-specific webhook:"
echo "WABB_WEBHOOK_URL_RESUME=https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/"
echo ""
echo "3️⃣ API Base URL (for generating download links):"
echo "API_BASE_URL=https://campuspe-api-staging.azurewebsites.net"
echo ""
echo "🔑 Required WABB Environment Variables:"
echo "WABB_API_KEY=your-actual-wabb-api-key"
echo ""

echo "📍 How to fix in Azure Portal:"
echo "1. Go to Azure Portal → App Services → campuspe-api-staging"
echo "2. Navigate to Configuration → Application settings"
echo "3. Update these environment variables with the correct WABB.in URLs"
echo "4. Save and restart the app service"
echo ""

echo "🧪 After fixing, test with:"
echo "curl -X POST https://campuspe-api-staging.azurewebsites.net/api/wabb/generate-and-share \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"name\": \"Test User\","
echo "    \"email\": \"test@campuspe.com\","
echo "    \"phone\": \"919156621088\","
echo "    \"jobDescription\": \"Looking for a developer\""
echo "  }'"
