#!/bin/bash

echo "📊 CampusPe Deployment Monitor"
echo "============================"

WEB_URL="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"
API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"

echo ""
echo "⏱️  Monitoring deployment progress..."
echo "GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo ""

# Function to test URL
test_service() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name... "
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    case $status_code in
        200)
            echo "✅ SUCCESS ($status_code)"
            return 0
            ;;
        503)
            echo "❌ SERVICE UNAVAILABLE ($status_code)"
            return 1
            ;;
        404)
            echo "⚠️  NOT FOUND ($status_code)"
            return 1
            ;;
        000)
            echo "❌ CONNECTION FAILED (timeout/unreachable)"
            return 1
            ;;
        *)
            echo "⚠️  UNEXPECTED STATUS ($status_code)"
            return 1
            ;;
    esac
}

# Monitor loop
echo "🔄 Starting monitoring (checking every 30 seconds)..."
echo "Press Ctrl+C to stop monitoring"
echo ""

attempt=1
max_attempts=20

while [ $attempt -le $max_attempts ]; do
    echo "--- Attempt $attempt/$max_attempts ($(date +"%H:%M:%S")) ---"
    
    # Test API
    test_service "API" "$API_URL"
    api_status=$?
    
    # Test Web
    test_service "Web" "$WEB_URL"
    web_status=$?
    
    echo ""
    
    # Check if web service is now working
    if [ $web_status -eq 0 ]; then
        echo "🎉 SUCCESS! Web service is now responding!"
        echo ""
        echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY"
        echo "🌐 Web URL: $WEB_URL"
        echo "🔗 API URL: $API_URL"
        echo ""
        echo "🧪 Run comprehensive tests:"
        echo "./comprehensive-test.sh"
        exit 0
    fi
    
    # Show status summary
    if [ $web_status -ne 0 ]; then
        echo "⏳ Web service still starting... (attempt $attempt/$max_attempts)"
        echo ""
        echo "💡 NEXT STEPS IF THIS CONTINUES TO FAIL:"
        echo "1. Check Azure Portal logs: App Services → campuspe-web-staging → Monitoring → Log stream"
        echo "2. Verify environment variables are set in Azure Portal"
        echo "3. Run: ./diagnose-503-error.sh"
        echo ""
    fi
    
    if [ $attempt -lt $max_attempts ]; then
        echo "⏳ Waiting 30 seconds before next check..."
        sleep 30
    fi
    
    attempt=$((attempt + 1))
done

echo ""
echo "⏰ Monitoring completed after $max_attempts attempts"
echo ""
echo "🚨 WEB SERVICE STILL NOT RESPONDING"
echo ""
echo "📋 IMMEDIATE ACTIONS REQUIRED:"
echo "1. 🔍 Check Azure Portal logs immediately"
echo "2. ⚙️  Verify environment variables are set"
echo "3. 🔄 Try manual restart in Azure Portal"
echo "4. 📊 Run diagnostics: ./diagnose-503-error.sh"
echo ""
echo "🆘 If issues persist, check the enhanced startup logs in Azure Portal"
echo "   The new startup script provides detailed diagnostics"

