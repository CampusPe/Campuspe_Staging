# Azure Deployment Status & Troubleshooting

## Current Status

✅ **API Deployment**: SUCCESSFUL  
✅ **Web Deployment**: SUCCESSFUL  
🔧 **Configuration**: Environment variables need to be set

## New Issue Identified

🚨 **API-Web Communication Problems:**

1. ❌ **Web app is calling localhost:5001** instead of Azure API
2. ❌ **CORS errors** - API only allows localhost:3000, but web app is on Azure domain
3. ❌ **Environment variables not configured** in Azure Portal

## Root Cause

The deployments work, but the applications are configured for local development, not Azure production:

- Web app: Missing `NEXT_PUBLIC_API_URL` environment variable
- API: CORS only configured for localhost, not Azure domains

## Solution

✅ **Updated API CORS configuration** to support multiple origins  
🔧 **Created comprehensive Azure environment variable guide**

## URGENT ACTION REQUIRED

**Configure environment variables in Azure Portal** - see `AZURE_ENV_CONFIG.md` for exact steps.

**Critical variables to set:**

**API Service:**

- `CORS_ORIGIN=https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net`
- `MONGODB_URI=your-mongodb-connection-string`
- `JWT_SECRET=your-jwt-secret`

**Web Service:**
- `NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net`
 codex/fix-login-error-during-azure-deployment
If you see `ERR_NAME_NOT_RESOLVED` in the browser, double‑check that this
URL matches the one displayed in the Azure Portal, including any unique
suffix and region code.

## Next Steps
 main

### 1. Trigger New Web Deployment

Push any change to trigger the workflow, or run it manually:

- Go to GitHub Actions
- Select "Build and deploy Web to Azure Web App - campuspe-web-staging"
- Click "Run workflow"

### 2. Monitor Deployment

Watch the GitHub Actions logs for:

- ✅ Successful build step
- ✅ Successful deployment package creation
- ✅ Successful Azure deployment

### 3. Configure Azure Environment Variables

In Azure Portal > campuspe-web-staging > Configuration:
 codex/fix-login-error-during-azure-deployment
```
NODE_ENV=production
# Azure web apps default to port 8080
PORT=8080
NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
NEXT_TELEMETRY_DISABLED=1
```
 main

### 4. Verify Deployment

After successful deployment:

- Visit: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
- Check Azure App Service logs for any runtime errors
- Run the verification script: `./verify-deployment.sh`

## Common Azure Deployment Issues

### Build Issues

- **Symptom**: "Couldn't find pages directory"
- **Solution**: Fixed in workflow - now copies complete app structure

### Runtime Issues

- **Symptom**: "Cannot find module 'next'"
- **Solution**: Dependencies are now properly included in deployment

### IIS Integration Issues

- **Symptom**: "Server Error 500"
- **Solution**: Updated web.config and startup script

## Monitoring Commands

### Check deployment logs:

```bash
# In Azure Portal
App Services > campuspe-web-staging > Log stream
```

### Manual verification:

```bash
# Run from project root
./verify-deployment.sh
```

## Expected Timeline

- Build: ~2-3 minutes
- Deployment: ~1-2 minutes
- App startup: ~30-60 seconds

## Support URLs

- API Health: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health
- Web App: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
- Azure Portal: https://portal.azure.com

## What Changed

✅ Fixed deployment workflow structure  
✅ Added complete app file copying  
✅ Enhanced startup script with debugging  
✅ Improved error handling  
✅ Better Azure configuration

The deployment should now work correctly!
