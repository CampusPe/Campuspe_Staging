# Azure Deployment Troubleshooting Guide

## Fixed Issues ✅

1. **GitHub Actions Workflow Syntax Error**
   - Fixed malformed `env:` declaration in workflow file
   - Removed orphaned environment variable reference

2. **Startup Script Issues**
   - Fixed missing `fi` statements in `startup.sh`
   - Corrected bash syntax errors
   - Added proper error handling

3. **Server Configuration**
   - Enhanced `server-azure.js` with better error handling
   - Added health check endpoint (`/health`)
   - Improved graceful shutdown process
   - Added Azure App Service detection

4. **Startup Process**
   - Enhanced `startup.js` with Azure environment detection
   - Added comprehensive file existence checks
   - Better error reporting and diagnostics

## Deployment Process

### 1. Pre-deployment Checklist
- ✅ Next.js build artifacts (`.next` folder) are created
- ✅ All dependencies are installed
- ✅ Environment variables are properly set
- ✅ `startup.js` is the entry point in Azure

### 2. Azure App Service Configuration

**Required Environment Variables:**
```
PORT=8080
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
NEXT_PUBLIC_SITE_URL=https://dev.campuspe.com
WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
WEBSITE_RUN_FROM_PACKAGE=1
NEXT_TELEMETRY_DISABLED=1
```

**Startup Command:**
```
node startup.js
```

### 3. Health Check
Once deployed, verify the application is running:
- Health endpoint: `https://dev.campuspe.com/health`
- Should return: `{"status":"healthy","timestamp":"...","environment":"production","port":8080}`

### 4. Common Issues & Solutions

#### Issue: "env:: command not found"
- **Cause:** Syntax error in shell script or workflow
- **Solution:** ✅ Fixed in GitHub Actions workflow

#### Issue: "Missing build artifacts"
- **Cause:** `.next` folder not created or not included in deployment
- **Solution:** Ensure `npm run build` runs successfully in CI/CD

#### Issue: "Module not found" errors
- **Cause:** Missing dependencies or incorrect paths
- **Solution:** Check `package.json` and ensure all deps are installed

#### Issue: Application not starting
- **Diagnostic Steps:**
  1. Check Azure Portal → App Service → Log Stream
  2. Verify environment variables
  3. Check startup command is set to `startup.js`
  4. Verify health endpoint response

### 5. Local Testing
To test the Azure configuration locally:

```bash
# Navigate to web app directory
cd apps/web

# Set environment variables
export NODE_ENV=production
export PORT=8080

# Build the application
npm run build

# Start with Azure server
node startup.js
```

## Monitoring & Logs

### Azure Portal Locations:
1. **Log Stream:** App Service → Monitoring → Log stream
2. **Application Insights:** App Service → Monitoring → Application Insights
3. **Metrics:** App Service → Monitoring → Metrics

### Key Metrics to Monitor:
- HTTP requests per second
- Response time
- Error rate
- Memory usage
- CPU usage

## Next Steps

1. **Deploy the fixes:** Push these changes to trigger a new deployment
2. **Monitor deployment:** Watch the GitHub Actions workflow
3. **Verify health:** Check the `/health` endpoint
4. **Test functionality:** Ensure the application works as expected

## Emergency Rollback
If issues persist:
1. Azure Portal → App Service → Deployment Center
2. Select previous successful deployment
3. Click "Redeploy"
