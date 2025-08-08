#!/bin/bash

# Azure Deployment Verification Script
# Run this after deployment to verify everything is working

echo "🚀 Verifying CampusPe Azure Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
WEB_URL="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"

echo -e "\n📊 Checking API Health..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health" || echo "000")

if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API is running successfully${NC}"
else
    echo -e "${RED}❌ API health check failed (HTTP: $API_RESPONSE)${NC}"
fi

echo -e "\n🌐 Checking Web Application..."
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${WEB_URL}" || echo "000")

if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Web application is running successfully${NC}"
else
    echo -e "${RED}❌ Web application check failed (HTTP: $WEB_RESPONSE)${NC}"
fi

echo -e "\n🔗 Testing API Connectivity..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/auth/health" || echo "000")

if [ "$AUTH_RESPONSE" = "200" ] || [ "$AUTH_RESPONSE" = "404" ]; then
    echo -e "${GREEN}✅ API endpoints are accessible${NC}"
else
    echo -e "${RED}❌ API endpoints not accessible (HTTP: $AUTH_RESPONSE)${NC}"
fi

echo -e "\n📱 Application URLs:"
echo -e "API: ${YELLOW}${API_URL}${NC}"
echo -e "Web: ${YELLOW}${WEB_URL}${NC}"

echo -e "\n🛠️  Common Issues:"
echo -e "• If API fails: Check MongoDB connection string and environment variables"
echo -e "• If Web fails: Check NEXT_PUBLIC_API_URL environment variable"
echo -e "• Check Azure App Service logs for detailed error information"

echo -e "\n✨ Deployment verification complete!"
