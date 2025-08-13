#!/bin/bash

echo "🔍 CampusPe Login Investigation"
echo "============================="

# Test different user types to isolate the issue

echo "1. Testing Admin Login (should work):"
admin_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}')

admin_code=$(echo "$admin_response" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
echo "   Status: $admin_code"
if [ "$admin_code" = "200" ]; then
    echo "   ✅ Admin login works"
else
    echo "   ❌ Admin login failed"
fi

echo ""
echo "2. Testing with Non-existent User (should return 400):"
fake_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com","password":"fakepassword"}')

fake_code=$(echo "$fake_response" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
echo "   Status: $fake_code"
if [ "$fake_code" = "400" ]; then
    echo "   ✅ Proper error handling for non-existent user"
elif [ "$fake_code" = "500" ]; then
    echo "   ❌ 500 error for non-existent user - this shouldn't happen"
fi

echo ""
echo "3. Testing Student Registration + Login:"
echo "   Creating a test student user..."

# Register a student
register_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"teststudent@example.com",
    "password":"password123",
    "firstName":"Test",
    "lastName":"Student",
    "phone":"1234567890",
    "userType":"student"
  }')

register_code=$(echo "$register_response" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
echo "   Registration Status: $register_code"

if [ "$register_code" = "201" ] || [ "$register_code" = "200" ]; then
    echo "   ✅ Student registration successful"
    
    # Now try to login as student
    echo "   Attempting student login..."
    student_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"teststudent@example.com","password":"password123"}')
    
    student_code=$(echo "$student_response" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
    student_body=$(echo "$student_response" | sed '$d')
    
    echo "   Student Login Status: $student_code"
    if [ "$student_code" = "500" ]; then
        echo "   ❌ FOUND THE ISSUE: Student login returns 500 error"
        echo "   Response: $student_body"
    elif [ "$student_code" = "200" ]; then
        echo "   ✅ Student login works"
    else
        echo "   ⚠️  Unexpected status: $student_code"
    fi
else
    echo "   ⚠️  Student registration failed with status: $register_code"
    echo "   Response: $(echo "$register_response" | sed '$d')"
fi

echo ""
echo "4. Testing College Registration + Login:"
college_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testcollege@example.com",
    "password":"password123",
    "collegeName":"Test College",
    "userType":"college"
  }')

college_register_code=$(echo "$college_response" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
echo "   College Registration Status: $college_register_code"

if [ "$college_register_code" = "201" ] || [ "$college_register_code" = "200" ]; then
    echo "   ✅ College registration successful"
    
    # Try college login
    college_login_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"testcollege@example.com","password":"password123"}')
    
    college_login_code=$(echo "$college_login_response" | tail -1 | grep "HTTP_CODE:" | cut -d: -f2)
    
    echo "   College Login Status: $college_login_code"
    if [ "$college_login_code" = "500" ]; then
        echo "   ❌ FOUND THE ISSUE: College login also returns 500 error"
    elif [ "$college_login_code" = "200" ]; then
        echo "   ✅ College login works"
    fi
else
    echo "   ⚠️  College registration failed"
fi

echo ""
echo "📊 Summary:"
echo "If student/college logins show 500 errors, the issue is likely:"
echo "1. User model schema validation failing"
echo "2. Missing required fields in the User document"
echo "3. Database constraint violations"
echo "4. JWT token generation issues for specific user roles"
echo ""
echo "Check the API server logs for detailed error messages during login attempts."
