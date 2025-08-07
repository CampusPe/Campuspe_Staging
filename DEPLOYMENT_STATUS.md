# Azure Deployment Status & Troubleshooting

## Current Status

✅ **API Deployment**: SUCCESSFUL  
🔄 **Web Deployment**: FIXING (Root cause identified and resolved)

## Issue Resolution

The web deployment was failing because:

1. ❌ Azure was trying to build from the root directory instead of `apps/web`
2. ❌ Next.js couldn't find the `pages` directory
3. ❌ **KEY ISSUE**: The `.next` directory wasn't being copied (hidden files issue)

## Fixes Applied

1. ✅ **Fixed hidden files copying** - Changed from `cp -r apps/web/*` to `cp -r . ` method
2. ✅ **Enhanced build verification** - Added comprehensive debug logging to workflow
3. ✅ **Updated Next.js config** - Removed problematic standalone mode for monorepo
4. ✅ **Improved startup script** with better error handling and fallback options
5. ✅ **Added local testing** - Created test script confirming .next directory copies correctly

## Test Results

✅ **Local build**: Working perfectly (verified)  
✅ **Local deployment package**: .next directory copied successfully (tested)  
✅ **File structure**: All required files present including hidden files

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
