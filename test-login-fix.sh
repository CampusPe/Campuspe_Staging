#!/bin/bash

echo "🔍 Testing Login Endpoint Fix"
echo "=============================="

# Wait for API to be ready
echo "Waiting for API server to be ready..."
for i in {1..10}; do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo "✅ API server is ready"
        break
    fi
    echo "⏳ Waiting... ($i/10)"
    sleep 2
done

# Test admin login
echo ""
echo "🔐 Testing Admin Login:"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}')

# Extract HTTP code and body
http_code=$(echo "$response" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response Body: $body"

if [ "$http_code" = "200" ]; then
    echo "✅ Admin login working correctly"
else
    echo "❌ Admin login failed with status $http_code"
fi

# Test invalid login to ensure error handling works
echo ""
echo "🔐 Testing Invalid Login (should return 400):"
invalid_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrongpassword"}')

invalid_http_code=$(echo "$invalid_response" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
invalid_body=$(echo "$invalid_response" | sed '$d')

echo "HTTP Status: $invalid_http_code"
echo "Response Body: $invalid_body"

if [ "$invalid_http_code" = "400" ]; then
    echo "✅ Invalid login handled correctly"
elif [ "$invalid_http_code" = "500" ]; then
    echo "❌ Still getting 500 error for invalid login"
else
    echo "⚠️  Unexpected status code: $invalid_http_code"
fi

echo ""
echo "🌐 Frontend Test:"
echo "Now try logging in through the web interface at:"
echo "http://localhost:3000/login"
echo ""
echo "Admin credentials: admin@gmail.com / admin123"
