# 🚀 CampusPe Azure Deployment Guide

## Prerequisites
- Azure subscription
- Azure CLI installed
- MongoDB Atlas password

## Step 1: Create Azure App Services

### For API Backend:
1. Go to Azure Portal → Create Resource → Web App
2. **App Name**: `campuspe-api-staging`
3. **Runtime**: Node.js 20 LTS
4. **Region**: East US (or your preferred region)
5. **Pricing Plan**: B1 Basic (or higher)

### For Frontend:
1. Create another Web App
2. **App Name**: `campuspe-web-staging`
3. **Runtime**: Node.js 20 LTS
4. **Region**: Same as API
5. **Pricing Plan**: B1 Basic (or higher)

## Step 2: Configure Environment Variables

### In Azure Portal → App Services → campuspe-api-staging → Configuration:

Add these Application Settings:
```
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
CLAUDE_API_KEY=sk-ant-api03-your-claude-api-key-here
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-api-key-here
JWT_SECRET=your-super-secret-jwt-key-256-bits
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://campuspe-web-staging.azurewebsites.net
TWOFACTOR_API_KEY=your-2fa-api-key-here
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=your-key
AZURE_COMMUNICATION_EMAIL_FROM=noreply@yourdomain.com
WABB_WEBHOOK_URL=https://api.wabb.in/api/v1/webhooks-automation/catch/your-webhook-id/
WABB_WEBHOOK_TOKEN=your-wabb-webhook-token
WHATSAPP_TOKEN=your_whatsapp_business_api_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=campuspe_whatsapp_verify_token_2025
```

## Step 3: Configure Deployment

### For API (campuspe-api-staging):
1. Go to Deployment → Deployment Center
2. Source: GitHub
3. Repository: `Manjunathk89/campuspe-staging`
4. Branch: `main`
5. Build Provider: App Service Build Service
6. **Startup Command**: `cd apps/api && npm install && npm run build && npm start`

### For Frontend (campuspe-web-staging):
1. Go to Deployment → Deployment Center
2. Source: GitHub
3. Repository: `Manjunathk89/campuspe-staging`
4. Branch: `main`
5. Build Provider: App Service Build Service
6. **Startup Command**: `cd apps/web && npm install && npm run build && npm start`

## Step 4: Your Staging URLs
- **API**: https://campuspe-api-staging.azurewebsites.net
- **Frontend**: https://campuspe-web-staging.azurewebsites.net

## Step 5: Health Check
- API Health: https://campuspe-api-staging.azurewebsites.net/health
- Frontend: https://campuspe-web-staging.azurewebsites.net

## Troubleshooting
- Check Application Logs in Azure Portal
- Verify all environment variables are set
- Ensure MongoDB Atlas allows Azure IP addresses
- Check build logs in Deployment Center

## Important Notes
1. Replace `YOUR_PASSWORD` with actual MongoDB Atlas password
2. Update CORS_ORIGIN in API to match frontend URL
3. Consider using Azure Key Vault for sensitive data
4. Enable Application Insights for monitoring
