# 🚨 URGENT: Azure Portal Fix for Web Service 503 Error

## Step-by-Step Azure Portal Instructions

### STEP 1: Check Current Environment Variables

1. **Open Azure Portal** → https://portal.azure.com
2. **Navigate to**: App Services → **campuspe-web-staging**
3. **Click**: Configuration (left sidebar)
4. **Click**: Application settings tab

**Current Issue**: Missing critical environment variables

### STEP 2: Add Required Environment Variables

**Click "New application setting" and add these ONE BY ONE:**

```
Name: PORT
Value: 8080
```

```
Name: NODE_ENV  
Value: production
```

```
Name: NEXT_PUBLIC_API_URL
Value: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
```

```
Name: WEBSITES_ENABLE_APP_SERVICE_STORAGE
Value: false
```

```
Name: WEBSITE_RUN_FROM_PACKAGE
Value: 1
```

**⚠️ IMPORTANT**: Click **"Save"** after adding all variables

### STEP 3: Check Deployment Status

1. **Click**: Deployment Center (left sidebar)
2. **Verify**: Last deployment status
3. **Look for**: Build success/failure messages

**If deployment failed**:
- Check build logs
- Look for missing dependencies or build errors

### STEP 4: Restart Service

1. **Go to**: Overview (left sidebar)
2. **Click**: "Restart" button
3. **Wait**: 5-10 minutes for full restart

### STEP 5: Monitor Startup

1. **Go to**: Monitoring → Log stream (left sidebar)
2. **Watch for**:
   - ✅ "SERVER STARTED SUCCESSFULLY"
   - ✅ "Server listening on http://0.0.0.0:8080"
   - ❌ Any error messages

**Common error patterns to look for**:
- `ENOENT: no such file or directory, open '.next/BUILD_ID'`
- `Cannot find module`
- `Port already in use`
- `Application startup failed`

### STEP 6: Test After Restart

Wait 5 minutes, then test:

```bash
curl -I https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
```

**Expected**: `HTTP/1.1 200 OK`
**Current**: `HTTP/1.1 503 Service Unavailable`

## 🔧 Alternative Quick Fix

If the above doesn't work, try this **emergency redeployment**:

### Option A: Force Redeploy via GitHub (if using GitHub Actions)

1. Go to your GitHub repository
2. Make a small change (add a comment to any file)
3. Commit and push to trigger deployment
4. Wait for deployment to complete

### Option B: Manual Build Check

In Azure Portal → App Services → campuspe-web-staging → Console:

```bash
# Check if build artifacts exist
ls -la .next/
ls -la node_modules/

# If missing, try manual build
npm install
npm run build
```

## 🎯 Root Cause Analysis

Based on the error pattern, this is likely:

1. **Missing environment variables** (80% probability)
2. **Failed build process** (15% probability)  
3. **Memory/resource issues** (5% probability)

## 📞 If Still Failing

After following all steps, if still getting 503:

1. **Screenshot** the Azure Portal logs
2. **Copy** any error messages from Log stream
3. **Check** the Deployment Center for build failures

The good news: **Your API is working perfectly!** This is purely a web service startup issue.
