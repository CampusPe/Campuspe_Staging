# Azure Deployment Status & Troubleshooting

## Current Status

✅ **API Deployment**: SUCCESSFUL  
❌ **Web Deployment**: FAILED (Fixed - Ready for retry)

## Issue Resolution

The web deployment was failing because:

1. Azure was trying to build from the root directory instead of `apps/web`
2. Next.js couldn't find the `pages` directory
3. The deployment package wasn't structured correctly

## Fixes Applied

1. **Updated workflow** to copy the complete Next.js app structure
2. **Enhanced startup script** with better error handling and fallback options
3. **Improved web.config** for better Azure IIS integration
4. **Added debug logging** to troubleshoot deployment issues

## Next Steps

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

```
NODE_ENV=production
PORT=80
NEXT_PUBLIC_API_URL=https://campuspe-api-staging.azurewebsites.net/api
NEXT_TELEMETRY_DISABLED=1
```

### 4. Verify Deployment

After successful deployment:

- Visit: https://campuspe-web-staging.azurewebsites.net
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

- API Health: https://campuspe-api-staging.azurewebsites.net/health
- Web App: https://campuspe-web-staging.azurewebsites.net
- Azure Portal: https://portal.azure.com

## What Changed

✅ Fixed deployment workflow structure  
✅ Added complete app file copying  
✅ Enhanced startup script with debugging  
✅ Improved error handling  
✅ Better Azure configuration

The deployment should now work correctly!
