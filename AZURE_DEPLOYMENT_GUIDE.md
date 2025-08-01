# 🚀 CampusPe Azure Deployment Guide

## Repository Setup ✅
- **New Repository**: https://github.com/CampusPe/Campuspe_Staging.git
- **Clean Structure**: Optimized for Azure deployment
- **CI/CD Ready**: GitHub Actions workflows configured

## Step 1: Create Azure App Services

### API Backend App Service
```bash
# Create Resource Group
az group create --name campuspe-staging --location eastus

# Create API App Service
az webapp create \
  --resource-group campuspe-staging \
  --plan campuspe-plan \
  --name campuspe-api-staging \
  --runtime "NODE:20-lts" \
  --sku B1
```

### Frontend App Service
```bash
# Create Web App Service
az webapp create \
  --resource-group campuspe-staging \
  --plan campuspe-plan \
  --name campuspe-web-staging \
  --runtime "NODE:20-lts" \
  --sku B1
```

## Step 2: Configure Environment Variables

### API App Service Configuration
In Azure Portal → App Services → campuspe-api-staging → Configuration:

```env
```
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://CampusPeAdmin:YOUR_PASSWORD@campuspestaging.adsljpw.mongodb.net/campuspe?retryWrites=true&w=majority&appName=CampuspeStaging
CLAUDE_API_KEY=your_claude_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here
JWT_SECRET=campuspe_super_secret_jwt_key_production_2025
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://campuspe-web-staging.azurewebsites.net
TWOFACTOR_API_KEY=880f24b5-5eed-11f0-a562-0200cd936042
AZURE_COMMUNICATION_CONNECTION_STRING=your_azure_communication_string
AZURE_COMMUNICATION_EMAIL_FROM=DoNotReply@campuspe.com
```

### Web App Service Configuration
In Azure Portal → App Services → campuspe-web-staging → Configuration:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://campuspe-api-staging.azurewebsites.net
```

## Step 3: Configure GitHub Secrets

### Required GitHub Repository Secrets
Go to: https://github.com/CampusPe/Campuspe_Staging/settings/secrets/actions

Add these secrets:
- `AZURE_API_PUBLISH_PROFILE`: Download from Azure Portal → campuspe-api-staging → Get publish profile
- `AZURE_WEB_PUBLISH_PROFILE`: Download from Azure Portal → campuspe-web-staging → Get publish profile

## Step 4: Deploy Using GitHub Actions

### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- API deployment: Triggered by changes in `apps/api/**`
- Web deployment: Triggered by changes in `apps/web/**`

### Manual Deployment
1. Go to GitHub Actions tab
2. Select "Deploy API to Azure Web App" or "Deploy Web to Azure Web App"
3. Click "Run workflow"

## Step 5: Verify Deployment

### Health Check URLs
- **API Health**: https://campuspe-api-staging.azurewebsites.net/health
- **Frontend**: https://campuspe-web-staging.azurewebsites.net

### Expected API Response
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "production",
  "database": "connected",
  "version": "1.0.0"
}
```

## Step 6: Configure Custom Startup Commands

### API Startup Command
```bash
cd apps/api && npm install && npm run build && npm start
```

### Web Startup Command
```bash
cd apps/web && npm install && npm run build && npm start
```

## Architecture Overview

```
GitHub Repository (CampusPe/Campuspe_Staging)
├── apps/api/          → Azure App Service (campuspe-api-staging)
├── apps/web/          → Azure App Service (campuspe-web-staging)
├── .github/workflows/ → GitHub Actions CI/CD
└── docs/              → Deployment guides
```

## Database Configuration
- **MongoDB Atlas**: Pre-configured cluster
- **Connection String**: Configured in Azure App Settings
- **Collections**: Students, Colleges, Recruiters, Jobs, Applications

## Monitoring & Logging
- **Application Insights**: Enabled for both services
- **Log Stream**: Available in Azure Portal
- **Metrics**: CPU, Memory, Response times

## Security Configuration
- **HTTPS**: Enforced by default
- **CORS**: Configured for cross-origin requests
- **JWT**: Secure token-based authentication
- **Environment Variables**: Stored securely in Azure

## Troubleshooting

### Common Issues
1. **Build failures**: Check Node.js version (20 LTS required)
2. **Database connection**: Verify MongoDB Atlas IP whitelist includes Azure
3. **CORS errors**: Ensure CORS_ORIGIN matches frontend URL
4. **Environment variables**: Verify all required secrets are set

### Debug Commands
```bash
# Check app logs
az webapp log tail --name campuspe-api-staging --resource-group campuspe-staging

# Restart app service
az webapp restart --name campuspe-api-staging --resource-group campuspe-staging
```

## Next Steps
1. Set up custom domain names
2. Configure SSL certificates
3. Enable autoscaling
4. Set up staging/production slots
5. Configure backup strategies

---

**Ready for Production Deployment! 🎉**
