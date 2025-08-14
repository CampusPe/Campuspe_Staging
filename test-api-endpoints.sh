#!/bin/bash

# Recruiter Dashboard API Testing Script
# This script tests all the fixed endpoints for the recruiter dashboard

API_BASE="http://localhost:5001/api"

echo "🔍 Testing Recruiter Dashboard API Endpoints..."
echo "=============================================="

# Test 1: Health Check
echo ""
echo "1. Testing API Health Check..."
curl -s -o /dev/null -w "Status: %{http_code}\n" $API_BASE/health

# Test 2: Jobs endpoint
echo ""
echo "2. Testing Jobs Endpoints..."
echo "   - GET /api/jobs (public jobs listing)"
curl -s -o /dev/null -w "Status: %{http_code}\n" $API_BASE/jobs

# Test 3: Applications endpoint (requires auth)
echo ""
echo "3. Testing Applications Endpoints..."
echo "   - GET /api/applications/my-applications (requires authentication)"
echo "   - This will return 401 without token (expected)"
curl -s -o /dev/null -w "Status: %{http_code}\n" $API_BASE/applications/my-applications

# Test 4: Recruiters endpoints
echo ""
echo "4. Testing Recruiter Endpoints..."
echo "   - GET /api/recruiters/profile (requires authentication)"
echo "   - This will return 401 without token (expected)"
curl -s -o /dev/null -w "Status: %{http_code}\n" $API_BASE/recruiters/profile

echo "   - GET /api/recruiters/stats (requires authentication)"
echo "   - This will return 401 without token (expected)"
curl -s -o /dev/null -w "Status: %{http_code}\n" $API_BASE/recruiters/stats

# Test 5: Interview endpoints
echo ""
echo "5. Testing Interview Endpoints..."
echo "   - GET /api/interviews/my-interviews (requires authentication)"
echo "   - This will return 401 without token (expected)"
curl -s -o /dev/null -w "Status: %{http_code}\n" $API_BASE/interviews/my-interviews

# Test 6: Invitation endpoints
echo ""
echo "6. Testing Invitation Endpoints..."
echo "   - GET /api/invitations/:id (requires valid invitation ID)"
echo "   - Using dummy ID for structure test"
curl -s -o /dev/null -w "Status: %{http_code}\n" $API_BASE/invitations/123456789012345678901234

echo ""
echo "=============================================="
echo "✅ API Testing Complete!"
echo ""
echo "📋 Expected Results:"
echo "   - Health check: 200"
echo "   - Public endpoints: 200"
echo "   - Protected endpoints: 401 (without auth token)"
echo "   - Invalid IDs: 400 or 404"
echo ""
echo "🚀 To test authenticated endpoints:"
echo "   1. Login via the web app (http://localhost:3000)"
echo "   2. Use the recruiter dashboard to test functionality"
echo "   3. Check browser developer tools for API calls"
echo ""
echo "🌐 Web Application: http://localhost:3000"
echo "🔧 API Server: http://localhost:5001"
