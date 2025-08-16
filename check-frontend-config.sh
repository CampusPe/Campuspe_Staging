#!/bin/bash

echo "🧪 Testing Frontend Environment Variables"
echo "========================================="
echo ""

# Test what API URL the frontend is actually using
echo "🔍 Checking frontend API configuration..."
echo ""

# Test the web app's actual configuration
curl -s "https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net/_next/static/chunks/pages/_app*.js" | head -1 | grep -o "localhost" && echo "❌ Found localhost in frontend bundle - Environment variable not set!" || echo "✅ No localhost found in main bundle"

echo ""
echo "📝 You need to set this environment variable in Azure Portal:"
echo ""
echo "App Service: campuspe-web-staging"
echo "Setting: NEXT_PUBLIC_API_URL"
echo "Value: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
echo ""
echo "Steps:"
echo "1. Go to Azure Portal"
echo "2. Navigate to App Services → campuspe-web-staging"  
echo "3. Go to Configuration → Application Settings"
echo "4. Click '+ New application setting'"
echo "5. Name: NEXT_PUBLIC_API_URL"
echo "6. Value: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
echo "7. Click 'OK' then 'Save'"
echo "8. Wait for the app to restart"
echo ""
echo "🔄 After setting the variable, the app will restart automatically"
echo "   and should connect to the correct API endpoint."
