#!/bin/bash

echo "🔧 CampusPe Deployment Issues Fix"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Issues Identified:${NC}"
echo "1. ❌ Azure Web App Deployment - 403 Forbidden Error"
echo "2. ✅ Next.js Build Export Error - FIXED"
echo ""

echo -e "${YELLOW}🚀 Step 1: Building Web App with Fixed localStorage Issues${NC}"
cd apps/web
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Web build successful!${NC}"
else
    echo -e "${RED}❌ Web build failed${NC}"
    exit 1
fi
cd ../..

echo ""
echo -e "${YELLOW}🔑 Step 2: Azure Authentication Issues${NC}"
echo ""
echo "The 403 Forbidden error indicates Azure Service Principal authentication issues."
echo ""
echo -e "${BLUE}Possible causes:${NC}"
echo "• Expired Azure Service Principal credentials in GitHub Secrets"
echo "• Service Principal lacks deployment permissions"
echo "• App Service deployment settings misconfigured"
echo ""

echo -e "${YELLOW}🛠️  Manual Fixes Required:${NC}"
echo ""
echo "1️⃣ ${BLUE}Update GitHub Repository Secrets:${NC}"
echo "   Go to: https://github.com/CampusPe/Campuspe_Staging/settings/secrets/actions"
echo "   Update these secrets with fresh Azure credentials:"
echo "   • AZUREAPPSERVICE_CLIENTID_8A6DED1EC9FF4D6DBF9BC09565C923D6"
echo "   • AZUREAPPSERVICE_TENANTID_6F962B613A624D3582F2985BCDA08CE8"
echo "   • AZUREAPPSERVICE_SUBSCRIPTIONID_AE3ECD9C02CC4AD296820DF8B2D5C91F"
echo ""

echo "2️⃣ ${BLUE}Create New Service Principal (if needed):${NC}"
echo "   Run these Azure CLI commands:"
echo ""
echo "   # Login to Azure"
echo "   az login"
echo ""
echo "   # Create service principal for web app"
echo "   az ad sp create-for-rbac --name \"campuspe-web-deployment\" \\"
echo "     --role contributor \\"
echo "     --scopes /subscriptions/{subscription-id}/resourceGroups/campuspe-staging-rg/providers/Microsoft.Web/sites/campuspe-web-staging-erd8dvb3ewcjc5g2 \\"
echo "     --sdk-auth"
echo ""
echo "   # Create service principal for API app"
echo "   az ad sp create-for-rbac --name \"campuspe-api-deployment\" \\"
echo "     --role contributor \\"
echo "     --scopes /subscriptions/{subscription-id}/resourceGroups/CampusPe_Staging_group/providers/Microsoft.Web/sites/campuspe-api-staging \\"
echo "     --sdk-auth"
echo ""

echo "3️⃣ ${BLUE}Alternative: Manual Deployment via Azure CLI${NC}"
echo "   If GitHub Actions continue to fail, deploy manually:"
echo ""
echo "   # For Web App:"
echo "   cd /Users/ankitalokhande/Desktop/Campuspe_Staging/apps/web"
echo "   npm run build"
echo "   zip -r deployment.zip . -x node_modules/\\* .git/\\* *.log"
echo "   az webapp deploy --resource-group campuspe-staging-rg --name campuspe-web-staging-erd8dvb3ewcjc5g2 --src-path deployment.zip --type zip"
echo ""
echo "   # For API App:"
echo "   cd /Users/ankitalokhande/Desktop/Campuspe_Staging/apps/api"
echo "   npm run build"
echo "   zip -r deployment.zip . -x node_modules/\\* .git/\\* *.log"
echo "   az webapp deploy --resource-group CampusPe_Staging_group --name campuspe-api-staging --src-path deployment.zip --type zip"
echo ""

echo "4️⃣ ${BLUE}Verify Azure App Service Settings:${NC}"
echo "   • Check startup commands are correct"
echo "   • Ensure all environment variables are set"
echo "   • Verify Node.js version is 20.x"
echo ""

echo -e "${GREEN}📊 Current Status:${NC}"
echo "✅ Next.js build export issue - FIXED"
echo "✅ localStorage SSR issue - FIXED" 
echo "⚠️  Azure deployment 403 error - REQUIRES MANUAL INTERVENTION"
echo ""

echo -e "${YELLOW}🔗 Useful Links:${NC}"
echo "• GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo "• Azure Portal: https://portal.azure.com"
echo "• Web App Logs: https://portal.azure.com/#@/resource/subscriptions/{id}/resourceGroups/campuspe-staging-rg/providers/Microsoft.Web/sites/campuspe-web-staging-erd8dvb3ewcjc5g2/logStream"
echo "• API App Logs: https://portal.azure.com/#@/resource/subscriptions/{id}/resourceGroups/CampusPe_Staging_group/providers/Microsoft.Web/sites/campuspe-api-staging/logStream"
echo ""

echo -e "${BLUE}💡 Next Steps:${NC}"
echo "1. Update GitHub Secrets with fresh Azure credentials"
echo "2. Re-run the GitHub Actions workflow"
echo "3. If still failing, use manual deployment commands above"
echo "4. Monitor Azure App Service logs for any runtime issues"
echo ""

echo -e "${GREEN}🎉 Script completed! Ready for deployment.${NC}"
