#!/bin/bash

# Test College Dashboard and Company Dashboard Invitation System
# This script tests the key endpoints for both dashboards

API_BASE_URL="http://localhost:5001/api"
TOKEN="your-jwt-token-here"

echo "🔧 Testing College Dashboard and Company Dashboard Invitation System"
echo "======================================================================"

# Test 1: College Invitations Endpoint
echo "1. Testing College Invitations Endpoint..."
curl -X GET "$API_BASE_URL/colleges/invitations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n"

# Test 2: Recruiter/Company Profile Endpoint  
echo "2. Testing Recruiter/Company Profile Endpoint..."
curl -X GET "$API_BASE_URL/recruiters/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n"

# Test 3: College Profile Endpoint
echo "3. Testing College Profile Endpoint..."
curl -X GET "$API_BASE_URL/colleges/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n"

# Test 4: Student Profile by ID (public route)
echo "4. Testing Student Profile by ID..."
curl -X GET "$API_BASE_URL/students/123456789/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n"

# Test 5: Company Profile by ID (public route)
echo "5. Testing Company Profile by ID..."
curl -X GET "$API_BASE_URL/recruiters/123456789/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n"

# Test 6: College Profile by ID (public route)
echo "6. Testing College Profile by ID..."
curl -X GET "$API_BASE_URL/colleges/123456789/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n"

echo "✅ API Endpoint Testing Complete!"
echo "Note: Replace 'your-jwt-token-here' with actual JWT token and test IDs with real ones."
echo ""
echo "🔍 Key Issues Fixed:"
echo "- Added /api prefix to college invitation API calls in CollegeInvitationManager"
echo "- Created company dashboard with proper invitation handling"
echo "- Added public profile routes for colleges and companies"
echo "- Enhanced student profile with edit capabilities"
echo "- Created comprehensive profile pages for all user types"
echo ""
echo "📋 Testing Checklist:"
echo "□ College dashboard loads and displays invitations"
echo "□ Company dashboard shows jobs, applications, and invitations"
echo "□ Student profile pages load with proper data"
echo "□ College profile pages display institution information"
echo "□ Company profile pages show company details"
echo "□ Edit profile functionality works for students"
echo "□ Invitation accept/decline works from college dashboard"
echo "□ Navigation between profiles works correctly"
