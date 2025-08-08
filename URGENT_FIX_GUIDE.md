# 🚨 URGENT FIX: Azure Environment Variables

## Current Issues Identified:

### ❌ API Service: "Application Error"

- Service is not starting properly
- Likely MongoDB connection issue

### ❌ Web Service: Still calling localhost:5001

- Missing `https://` in NEXT_PUBLIC_API_URL
- Environment variable not properly formatted

## 🔧 IMMEDIATE FIXES REQUIRED:

### 1. Fix Web Service Environment Variables

**Go to: Azure Portal > campuspe-web-staging > Configuration > Application settings**

**CHANGE THIS:**

```
Name: NEXT_PUBLIC_API_URL
Value: campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net  ❌ WRONG
```

**TO THIS:**

```
Name: NEXT_PUBLIC_API_URL
Value: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net  ✅ CORRECT
```

### 2. Fix API Service Critical Variables

**Go to: Azure Portal > campuspe-api-staging > Configuration > Application settings**

**Ensure these are set correctly:**

```
MONGODB_URI=mongodb+srv://CampuspeAdmin:CampusPe@campuspestaging.adslpw.mongodb.net/campuspe-staging?retryWrites=true&w=majority
NODE_ENV=production
# Azure Linux web apps listen on port 8080
PORT=8080
HOST=0.0.0.0
CORS_ORIGIN=https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
JWT_SECRET=campuspe_super_secret_jwt_key_2025
```

## 🎯 EXACT STEPS TO FIX:

### Step 1: Fix Web Service API URL

1. Go to Azure Portal
2. Navigate to `campuspe-web-staging`
3. Click `Configuration` in left menu
4. Click `Application settings` tab
5. Find `NEXT_PUBLIC_API_URL`
6. Click the pencil/edit icon
7. Change value to: `https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net`
8. Click "OK"
9. Click "Save" at the top
10. Wait for restart (green checkmark)

### Step 2: Check API Service Status

1. Go to `campuspe-api-staging`
2. Check if "Application Error" is resolved
3. If still showing error, check MongoDB connection string
4. Look at "Log stream" for specific error messages

### Step 3: Test the Fix

1. Wait 2-3 minutes for both services to restart
2. Visit: `https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net/login`
3. Open browser developer tools (F12)
4. Try to login
5. Check Console tab - should now show requests to `campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net` instead of `localhost:5001`

## 🔍 Expected Results After Fix:

✅ Web app calls: `https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/auth/login`  
✅ No more localhost:5001 calls  
✅ No more CORS errors  
✅ API service shows proper response instead of "Application Error"  
✅ Login/register functionality works

## 🆘 If API Still Shows "Application Error":

1. Check the exact MongoDB connection string format
2. Verify username/password in connection string
3. Check Azure > App Service > Log stream for specific error
4. Ensure all required environment variables are set

The main issue is the missing `https://` in your NEXT_PUBLIC_API_URL!
