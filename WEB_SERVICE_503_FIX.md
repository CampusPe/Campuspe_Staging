# 🚨 URGENT: Web Service 503 Error Fix

## Root Cause Analysis
Your web service is returning 503 (Service Unavailable) which typically means:

1. **Missing build artifacts** - `.next` directory not found
2. **Environment variables not configured**
3. **Node.js startup failures**

## IMMEDIATE FIXES REQUIRED

### 1. Set Environment Variables in Azure Portal

**Go to: Azure Portal → App Services → campuspe-web-staging → Configuration → Application settings**

**Add these EXACT variables:**

```
PORT=8080
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
WEBSITE_RUN_FROM_PACKAGE=1
```

### 2. Check Deployment Configuration

**In Azure Portal → App Services → campuspe-web-staging → Deployment Center:**

Ensure:
- ✅ Build configuration is set correctly
- ✅ `npm run build` is executed during deployment
- ✅ `package.json` scripts are configured properly

### 3. Package.json Scripts Check

Your web app needs these scripts in `apps/web/package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "start": "node server-azure.js",
    "dev": "next dev"
  }
}
```

### 4. Build Command for Azure

If using GitHub Actions or Azure DevOps:

```bash
# Build commands in your pipeline:
cd apps/web
npm install
npm run build
```

### 5. Manual Fix via Azure Console

**Option A: Via Azure Portal:**
1. Go to **App Services** → **campuspe-web-staging** 
2. Click **Console** (under Development Tools)
3. Run these commands:

```bash
cd site/wwwroot
ls -la
# Check if .next directory exists
# If not, rebuild:
npm install
npm run build
```

**Option B: Restart Strategy:**
1. **Stop** the web service
2. **Add environment variables** (from step 1)
3. **Start** the web service
4. **Wait 3-5 minutes** for full startup

### 6. Debug Logs

**Check Application Logs:**
1. Azure Portal → App Services → campuspe-web-staging
2. **Monitoring** → **Log stream**
3. Look for startup errors

Common error patterns:
- `ENOENT: no such file or directory, open '.next/BUILD_ID'`
- `Cannot find module 'next'`
- `Port already in use`

## Emergency Verification Commands

After applying fixes, test immediately:

```bash
# Test web service specifically
curl -I https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net

# Expected response: HTTP/1.1 200 OK
# Current response: HTTP/1.1 503 Service Unavailable
```

## Priority Actions (Do in Order):

1. ⚡ **FIRST**: Add environment variables above
2. ⚡ **SECOND**: Restart web service 
3. ⚡ **THIRD**: Wait 3 minutes and test
4. ⚡ **FOURTH**: Check logs if still failing

**Your API is working perfectly** - we just need to fix the web service startup!
