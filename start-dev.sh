#!/bin/bash

echo "🚀 Starting CampusPe Development Environment"
echo "============================================="

# Function to kill processes on specific ports
cleanup_ports() {
    echo "🧹 Cleaning up existing processes..."
    lsof -t -i:3000 -i:5001 | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Function to start API server
start_api() {
    echo "🔧 Starting API Server..."
    cd /Users/premthakare/Desktop/Campuspe_Staging
    npm run dev:api &
    API_PID=$!
    echo "   API PID: $API_PID"
    sleep 5
}

# Function to start web server  
start_web() {
    echo "🌐 Starting Web Server..."
    cd /Users/premthakare/Desktop/Campuspe_Staging
    npm run dev:web &
    WEB_PID=$!
    echo "   Web PID: $WEB_PID"
    sleep 3
}

# Function to test services
test_services() {
    echo "🔍 Testing Services..."
    
    # Test API
    if curl -s http://localhost:5001/health > /dev/null; then
        echo "   ✅ API Server: Running on http://localhost:5001"
    else
        echo "   ❌ API Server: Not responding"
        return 1
    fi
    
    # Test Frontend
    if curl -s -o /dev/null http://localhost:3000; then
        echo "   ✅ Web Server: Running on http://localhost:3000"
    else
        echo "   ❌ Web Server: Not responding"
        return 1
    fi
    
    return 0
}

# Main execution
cleanup_ports
start_api
start_web

if test_services; then
    echo ""
    echo "🎉 SUCCESS! Both servers are running"
    echo ""
    echo "📋 Quick Reference:"
    echo "   • Frontend: http://localhost:3000"
    echo "   • API: http://localhost:5001"
    echo "   • Admin Login: admin@campuspe.com / admin123"
    echo "   • Health Check: http://localhost:5001/health"
    echo ""
    echo "✅ FIXED ISSUES:"
    echo "   • ERR_NAME_NOT_RESOLVED: Frontend now calls localhost:5001 instead of Azure"
    echo "   • 500 Internal Server Error: Fixed tenant ID validation for students/colleges"
    echo "   • Admin role validation: Added 'admin' to allowed roles"
    echo ""
    echo "🔧 To stop servers, run: killall node"
    echo "💡 Servers will keep running in background. Check terminal for logs."
else
    echo ""
    echo "❌ FAILED: Some services are not responding"
    echo "💡 Try running this script again or check the logs"
fi
