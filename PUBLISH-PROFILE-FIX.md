🔧 QUICK FIX: Use Publish Profile for Deployment
============================================

🎯 IMMEDIATE SOLUTION:

1️⃣ ADD PUBLISH PROFILE TO GITHUB SECRETS
========================================

• Go to: https://github.com/CampusPe/Campuspe_Staging/settings/secrets/actions
• Click: "New repository secret"
• Name: AZUREAPPSERVICE_PUBLISHPROFILE_WEB_STAGING  
• Value: Copy the ENTIRE publish profile content you shared:

<publishData><publishProfile profileName="campuspe-web-staging - Web Deploy" publishMethod="MSDeploy" publishUrl="campuspe-web-staging-erd8dvb3ewcjc5g2.scm.southindia-01.azurewebsites.net:443" msdeploySite="campuspe-web-staging" userName="$campuspe-web-staging" userPWD="5tcgXzTRMQ6riJqmSvqltb2xZkPvQqzLx2Hm3ipiPNrzAbhkHuPWWBSi9mgZ" destinationAppUrl="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="campuspe-web-staging - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-ma1-019.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="REDACTED" userPWD="REDACTED" destinationAppUrl="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net" SQLServerDBConnectionString="REDACTED" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="campuspe-web-staging - Zip Deploy" publishMethod="ZipDeploy" publishUrl="campuspe-web-staging-erd8dvb3ewcjc5g2.scm.southindia-01.azurewebsites.net:443" userName="$campuspe-web-staging" userPWD="5tcgXzTRMQ6riJqmSvqltb2xZkPvQqzLx2Hm3ipiPNrzAbhkHuPWWBSi9mgZ" destinationAppUrl="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile></publishData>

2️⃣ CURRENT STATUS:
=================
✅ Workflow updated to work with monorepo structure
✅ Fixed to use apps/web directory 
✅ Uses publish profile authentication (not service principal)
✅ Ready to deploy once secret is added

3️⃣ AFTER ADDING SECRET:
======================
• Commit and push changes
• GitHub Actions will deploy using publish profile
• No need for service principal secrets
• Should work immediately

🚨 NOTE: This will fix your EXISTING app service. 
If you still want to create a NEW one later, follow the previous guide.
