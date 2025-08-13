#!/bin/bash

echo "🔧 Testing Student/College Login Fix"
echo "===================================="

# Start API server if not running
if ! curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "Starting API server..."
    cd /Users/premthakare/Desktop/Campuspe_Staging/apps/api && npm run dev &
    API_PID=$!
    sleep 5
    echo "API server started with PID: $API_PID"
fi

echo ""
echo "✅ API Server Status:"
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "   API is running on http://localhost:5001"
else
    echo "   ❌ API server not responding"
    exit 1
fi

echo ""
echo "🧪 Testing the tenant ID fix..."

# Test admin login (should work)
echo "1. Admin Login Test:"
admin_result=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@gmail.com","password":"admin123"}')

admin_code=$(echo "$admin_result" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
echo "   Status: $admin_code"

# Now test with a fake student user to see if we get the proper error
echo ""
echo "2. Student Login Test (non-existent user):"
student_result=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"student@test.com","password":"password123"}')

student_code=$(echo "$student_result" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
echo "   Status: $student_code"

if [ "$student_code" = "400" ]; then
    echo "   ✅ Proper 400 error for non-existent student (good!)"
elif [ "$student_code" = "500" ]; then
    echo "   ❌ Still getting 500 error - fix didn't work"
    echo "   Response: $(echo "$student_result" | sed '$d')"
else
    echo "   ⚠️  Unexpected status: $student_code"
fi

echo ""
echo "📊 Summary:"
if [ "$admin_code" = "200" ] && [ "$student_code" = "400" ]; then
    echo "✅ LOGIN FIX SUCCESSFUL!"
    echo "   - Admin login: Working"
    echo "   - Student login error handling: Fixed (no more 500 errors)"
    echo ""
    echo "🎯 Ready to test in browser:"
    echo "   Frontend: http://localhost:3000/login"
    echo "   Admin credentials: admin@gmail.com / admin123"
elif [ "$student_code" = "500" ]; then
    echo "❌ FIX INCOMPLETE - Still getting 500 errors"
    echo "   Need to investigate further..."
else
    echo "⚠️  Partial fix - admin: $admin_code, student: $student_code"
fi

# Clean up background process if we started it
if [ ! -z "$API_PID" ]; then
    echo ""
    echo "Stopping API server (PID: $API_PID)..."
    kill $API_PID 2>/dev/null
fi
