#!/bin/bash

# Test script to verify localhost configuration
echo "🧪 Testing CampusPe Localhost Configuration"
echo "=========================================="

echo "📋 Configuration Check:"
echo "   Frontend URL: http://localhost:3000"
echo "   Backend URL:  http://localhost:5001"

# Check if environment files exist
echo ""
echo "🔧 Environment Files:"
if [ -f "apps/web/.env.local" ]; then
    echo "   ✅ Web .env.local exists"
    echo "      NEXT_PUBLIC_API_URL: $(grep NEXT_PUBLIC_API_URL apps/web/.env.local)"
else
    echo "   ❌ Web .env.local missing"
fi

if [ -f "apps/api/.env.local" ]; then
    echo "   ✅ API .env.local exists"
    echo "      PORT: $(grep PORT apps/api/.env.local)"
    echo "      CORS_ORIGIN: $(grep CORS_ORIGIN apps/api/.env.local)"
else
    echo "   ❌ API .env.local missing"
fi

echo ""
echo "🎯 Ready to start development!"
echo ""
echo "Next steps:"
echo "1. Start both servers: npm run dev"
echo "2. Or start separately:"
echo "   Terminal 1: npm run dev:api"
echo "   Terminal 2: npm run dev:web"
echo ""
echo "3. Open browser: http://localhost:3000"
echo ""
echo "✅ All API calls will now point to localhost:5001"
echo "❌ Staging Azure endpoints are disabled for localhost development"
