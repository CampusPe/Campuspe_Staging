#!/bin/bash

# Azure Configuration Verification Script
echo "🔍 Verifying CampusPe Azure Configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
WEB_URL="https://campuspe-web-staging.azurewebsites.net"

echo -e "\n${BLUE}📊 Checking API Health...${NC}"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health" || echo "000")

if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API is running successfully${NC}"
else
    echo -e "${RED}❌ API health check failed (HTTP: $API_RESPONSE)${NC}"
fi

echo -e "\n${BLUE}🌐 Checking Web Application...${NC}"
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${WEB_URL}" || echo "000")

if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Web application is running successfully${NC}"
else
    echo -e "${RED}❌ Web application check failed (HTTP: $WEB_RESPONSE)${NC}"
fi

echo -e "\n${BLUE}🔗 Testing API CORS Configuration...${NC}"
  CORS_TEST=$(curl -s -H "Origin: https://campuspe-web-staging.azurewebsites.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS "${API_URL}/api/auth/login" \
  -w "%{http_code}" -o /dev/null || echo "000")

if [ "$CORS_TEST" = "200" ] || [ "$CORS_TEST" = "204" ]; then
    echo -e "${GREEN}✅ CORS appears to be configured correctly${NC}"
else
    echo -e "${RED}❌ CORS configuration issue (HTTP: $CORS_TEST)${NC}"
    echo -e "${YELLOW}   → Check CORS_ORIGIN environment variable in API service${NC}"
fi

echo -e "\n${BLUE}📱 Testing API Connectivity from Web Domain...${NC}"
  API_CONNECTIVITY=$(curl -s -H "Origin: https://campuspe-web-staging.azurewebsites.net" \
  "${API_URL}/api/auth/health" \
  -w "%{http_code}" -o /dev/null || echo "000")

if [ "$API_CONNECTIVITY" = "200" ] || [ "$API_CONNECTIVITY" = "404" ]; then
    echo -e "${GREEN}✅ API is accessible from web domain${NC}"
else
    echo -e "${RED}❌ API connectivity issue from web domain (HTTP: $API_CONNECTIVITY)${NC}"
fi

echo -e "\n${YELLOW}📋 Application URLs:${NC}"
echo -e "API Health: ${BLUE}${API_URL}/health${NC}"
echo -e "Web App: ${BLUE}${WEB_URL}${NC}"
echo -e "Login Page: ${BLUE}${WEB_URL}/login${NC}"

echo -e "\n${YELLOW}🛠️  Configuration Checklist:${NC}"
echo -e "□ API Service environment variables configured"
echo -e "□ Web Service environment variables configured"
echo -e "□ CORS_ORIGIN includes web app domain"
echo -e "□ NEXT_PUBLIC_API_URL points to Azure API service"
echo -e "□ MongoDB connection string is valid"

echo -e "\n${YELLOW}📖 Next Steps:${NC}"
echo -e "1. Configure environment variables using AZURE_ENV_CONFIG.md"
echo -e "2. Wait 2-3 minutes for services to restart"
echo -e "3. Test login/register functionality"
echo -e "4. Check browser console for API connection errors"

echo -e "\n${GREEN}✨ Configuration verification complete!${NC}"
