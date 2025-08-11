🎯 FINAL CHECKLIST: New Web App Service Setup
==============================================

📋 STEP-BY-STEP COMPLETION GUIDE:

✅ PREPARATION COMPLETE:
□ New workflow file ready: .github/workflows/main_campuspe-web-staging-new.yml
□ API CORS updated for new domain
□ Test version v3.1 ready to deploy
□ All code pushed to GitHub

🔧 YOUR AZURE PORTAL TASKS:

1️⃣ DELETE OLD APP SERVICE
□ Go to Azure Portal
□ Search: campuspe-web-staging-erd8dvb3ewcjc5g2
□ Delete the old app service

2️⃣ CREATE NEW APP SERVICE
□ Create new Web App
□ Name: campuspe-web-staging-new
□ Runtime: Node 20 LTS
□ Region: South India
□ Linux OS

3️⃣ CONFIGURE DEPLOYMENT
□ Deployment Center → GitHub
□ Repository: CampusPe/Campuspe_Staging
□ Branch: main
□ App location: /apps/web
□ Output location: .next

4️⃣ SET ENVIRONMENT VARIABLES
□ NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
□ NODE_ENV=production
□ WEBSITE_NODE_DEFAULT_VERSION=20.x
□ SCM_DO_BUILD_DURING_DEPLOYMENT=true

5️⃣ ADD GITHUB SECRETS
□ Get 3 secrets from Azure Deployment Center
□ Add to GitHub: AZUREAPPSERVICE_CLIENTID_NEW_WEB
□ Add to GitHub: AZUREAPPSERVICE_TENANTID_NEW_WEB
□ Add to GitHub: AZUREAPPSERVICE_SUBSCRIPTIONID_NEW_WEB

6️⃣ TEST DEPLOYMENT
□ Check GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions
□ Verify new URL: https://campuspe-web-staging-new.azurewebsites.net
□ Test should show: "New App Service v3.1 - Testing! 🎉"

🎉 SUCCESS INDICATORS:
□ New app URL loads successfully
□ Homepage shows "v3.1 - Testing!" text
□ Jobs page works without CORS errors
□ API connection working properly

🔗 IMPORTANT URLS:
• Azure Portal: https://portal.azure.com
• GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions
• GitHub Secrets: https://github.com/CampusPe/Campuspe_Staging/settings/secrets/actions
• Working API: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
• New Web App: https://campuspe-web-staging-new.azurewebsites.net (after creation)
