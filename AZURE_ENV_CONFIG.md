# Azure Environment Variables Configuration

## URGENT: Configure These Environment Variables in Azure Portal

### 🔧 API Service (campuspe-api-staging)

Go to: Azure Portal > App Services > campuspe-api-staging > Configuration > Application settings

**Add these environment variables:**

```
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campuspe-staging

# Server Configuration
PORT=80
HOST=0.0.0.0
NODE_ENV=production

# CORS Configuration (CRITICAL - this fixes the login/register errors)
CORS_ORIGIN=https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-for-staging

# AI Services (if needed)
CLAUDE_API_KEY=your-claude-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Other services (if configured)
BUNNY_STORAGE_ZONE_NAME=your-storage-zone
BUNNY_STORAGE_ACCESS_KEY=your-access-key
BUNNY_CDN_URL=https://your-zone.b-cdn.net
WABB_API_KEY=your-wabb-api-key
WABB_WEBHOOK_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/webhook/whatsapp
```

### 🌐 Web Service (campuspe-web-staging)

Go to: Azure Portal > App Services > campuspe-web-staging > Configuration > Application settings

**Add these environment variables:**

```
# Production Configuration
NODE_ENV=production
PORT=80

# API Configuration (CRITICAL - this fixes the API connection)
NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net

# Optimization
NEXT_TELEMETRY_DISABLED=1
```

## 🚨 CRITICAL NOTES:

1. **CORS_ORIGIN**: Use your web app domain:
    - `campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net`

2. **NEXT_PUBLIC_API_URL**: Must point to your Azure API service, not localhost

3. **After setting these variables**:
   - Click "Save" in Azure Portal
   - Both services will automatically restart
   - Wait 2-3 minutes for changes to take effect

## 🔍 How to Verify Fix:

1. **Check API CORS**:
   - Visit: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health
   - Should return API status

2. **Check Web App API Connection**:
   - Visit: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net/login
   - Try to login - should no longer show CORS or localhost errors

3. **Browser Console**:
   - Should show requests to `campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net` instead of `localhost:5001`

## 📋 Step-by-Step Instructions:

1. Go to Azure Portal (portal.azure.com)
2. Navigate to "App Services"
3. Click on "campuspe-api-staging"
4. Go to "Configuration" in the left menu
5. Click "Application settings" tab
6. Add each environment variable listed above
7. Click "Save" at the top
8. Repeat steps 3-7 for "campuspe-web-staging"
9. Wait 2-3 minutes for services to restart
10. Test the login/register functionality

The errors you're seeing will be completely resolved once these environment variables are properly configured in Azure.
