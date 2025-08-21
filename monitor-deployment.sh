#!/bin/bash

echo "🔄 Monitoring Azure Deployment Progress..."
echo "========================================"
echo ""

# Function to check API health
check_api() {
    local url="https://campuspe-api-staging.azurewebsites.net/api/health"
    echo "⏳ Checking: $url"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/api_response.txt "$url" 2>/dev/null)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ API is responding! (HTTP $http_code)"
        cat /tmp/api_response.txt
        return 0
    else
        echo "❌ API not ready yet (HTTP $http_code)"
        return 1
    fi
}

# Function to test WABB endpoint
test_wabb() {
    local url="https://campuspe-api-staging.azurewebsites.net/api/wabb/health"
    echo "⏳ Testing WABB endpoint: $url"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/wabb_response.txt "$url" 2>/dev/null)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ WABB endpoint is working! (HTTP $http_code)"
        cat /tmp/wabb_response.txt
        return 0
    else
        echo "❌ WABB endpoint not ready (HTTP $http_code)"
        return 1
    fi
}

# Monitor deployment
echo "🚀 GitHub Actions should be deploying now..."
echo "📋 Expected timeline: 5-10 minutes"
echo ""

# Wait for deployment with retries
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "📊 Attempt $attempt/$max_attempts ($(date '+%H:%M:%S'))"
    
    if check_api; then
        echo ""
        echo "🎉 API deployment successful!"
        echo ""
        
        # Test WABB endpoint
        if test_wabb; then
            echo ""
            echo "✅ WABB integration is ready!"
            echo ""
            echo "🧪 You can now test the generate-and-share endpoint:"
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
            echo "📋 Next steps:"
            echo "1. Set real values for environment variables in Azure Portal"
            echo "2. Test with actual user data"
            echo "3. Monitor WABB.in dashboard for webhook deliveries"
            break
        fi
        break
    fi
    
    echo "⏳ Waiting 30 seconds before next check..."
    sleep 30
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    echo ""
    echo "⚠️ Deployment taking longer than expected"
    echo "📋 Manual checks:"
    echo "1. Check GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
    echo "2. Check Azure Portal deployment logs"
    echo "3. Verify environment variables are set"
fi

echo ""
echo "🔗 Useful links:"
echo "• Azure Portal: https://portal.azure.com"
echo "• GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo "• API Health: https://campuspe-api-staging.azurewebsites.net/api/health"
