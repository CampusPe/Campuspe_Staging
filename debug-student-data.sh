#!/bin/bash

echo "🔍 Debugging Student Data Structure"
echo ""

# Test if we can reach the API
echo "1️⃣ Testing API connectivity..."
curl -s http://localhost:5001/api/jobs > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ API server is running"
else
    echo "❌ API server is not running. Please start it first."
    exit 1
fi

echo ""

# Get a job ID to test with
echo "2️⃣ Getting job list..."
JOBS_RESPONSE=$(curl -s http://localhost:5001/api/jobs)
JOB_ID=$(echo $JOBS_RESPONSE | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    echo "❌ No jobs found. Create a job first to test matching."
    exit 1
fi

echo "✅ Found job ID: $JOB_ID"
echo ""

# Test the enhanced matching endpoint with debug info
echo "3️⃣ Testing matching endpoint with debug..."
curl -s "http://localhost:5001/api/jobs/$JOB_ID/matches?threshold=0.1&limit=3&includeDetails=true" | jq '.' > /tmp/debug_matches.json

if [ $? -eq 0 ]; then
    echo "✅ Matching API call successful"
    
    # Check if we got any results
    TOTAL_MATCHES=$(cat /tmp/debug_matches.json | jq -r '.data.totalMatches')
    RETURNED_MATCHES=$(cat /tmp/debug_matches.json | jq -r '.data.returnedMatches')
    
    echo "📊 Total matches: $TOTAL_MATCHES"
    echo "📊 Returned matches: $RETURNED_MATCHES"
    
    if [ "$RETURNED_MATCHES" != "0" ] && [ "$RETURNED_MATCHES" != "null" ]; then
        echo ""
        echo "👤 First student sample:"
        cat /tmp/debug_matches.json | jq -r '.data.matches[0].studentDetails' | head -10
        
        echo ""
        echo "📋 Student details structure:"
        cat /tmp/debug_matches.json | jq -r '.data.matches[0].studentDetails | keys[]'
    else
        echo "⚠️  No student matches returned"
        echo ""
        echo "🔍 Let's check the raw response:"
        cat /tmp/debug_matches.json | jq '.'
    fi
else
    echo "❌ Matching API call failed"
fi

echo ""

# Also test the basic jobs endpoint to see if jobs are being filtered correctly
echo "4️⃣ Testing jobs filtering..."
curl -s "http://localhost:5001/api/jobs" | jq '.[] | {id: ._id, title: .title, recruiterId: .recruiterId}' > /tmp/jobs_debug.json
echo "✅ Jobs data:"
cat /tmp/jobs_debug.json | head -20

echo ""
echo "🎯 Debug Summary:"
echo "- Check server logs for detailed student processing"
echo "- Verify students have proper userId associations"
echo "- Ensure student documents have firstName/lastName"
echo "- Check if User documents have email/phone fields"

# Cleanup
rm -f /tmp/debug_matches.json /tmp/jobs_debug.json
