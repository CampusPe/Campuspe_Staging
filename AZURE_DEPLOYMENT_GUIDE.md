# CampusPe Azure Deployment Guide

This guide covers the automated deployment of CampusPe to Azure App Services using GitHub Actions.

## 🌐 Deployment URLs

- **Frontend (Web)**: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
- **Backend (API)**: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net

## 🚀 Deployment Workflows

### Frontend Deployment (`campuspe-web-staging`)
- **Workflow File**: `.github/workflows/main_campuspe-web-staging.yml`
- **Trigger**: Push to `main` branch with changes in `apps/web/`
- **Build Process**: Next.js build with production optimizations
- **Startup Command**: `startup.js`

### Backend Deployment (`campuspe-api-staging`)
- **Workflow File**: `.github/workflows/main_campuspe-api-staging.yml`
- **Trigger**: Push to `main` branch with changes in `apps/api/`
- **Build Process**: TypeScript compilation to JavaScript
- **Startup Command**: `startup.sh`

## ⚙️ Azure Configuration

### Frontend Environment Variables (Required)
Set these in Azure Portal → App Service → Configuration → Application Settings:

```bash
PORT=8080
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
WEBSITE_RUN_FROM_PACKAGE=1
NEXT_TELEMETRY_DISABLED=1
```

### Backend Environment Variables (Required)
Set these in Azure Portal → App Service → Configuration → Application Settings:

```bash
PORT=8080
NODE_ENV=production
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
```

### Startup Commands
- **Frontend**: `startup.js`
- **Backend**: `startup.sh`

## 🔧 GitHub Secrets Configuration

Ensure these secrets are set in your GitHub repository:

### For Web App (Frontend)
- `AZUREAPPSERVICE_PUBLISHPROFILE_WEB_STAGING`: Publish profile for web app

### For API App (Backend)
- `AZUREAPPSERVICE_CLIENTID_8A6DED1EC9FF4D6DBF9BC09565C923D6`: Azure service principal client ID
- `AZUREAPPSERVICE_TENANTID_6F962B613A624D3582F2985BCDA08CE8`: Azure tenant ID
- `AZUREAPPSERVICE_SUBSCRIPTIONID_AE3ECD9C02CC4AD296820DF8B2D5C91F`: Azure subscription ID

## 📁 Project Structure

```
Campuspe_Staging/
├── apps/
│   ├── web/                    # Next.js Frontend
│   │   ├── server-azure.js     # Azure-optimized server
│   │   ├── startup.js          # Entry point for Azure
│   │   ├── startup.sh          # Shell startup script
│   │   └── web.config          # IIS configuration
│   └── api/                    # Express.js API
│       ├── server.js           # Entry point for Azure
│       ├── startup.sh          # Shell startup script
│       └── web.config          # IIS configuration
└── .github/workflows/          # GitHub Actions
    ├── main_campuspe-web-staging.yml
    └── main_campuspe-api-staging.yml
```

## 🔄 Deployment Process

### Automatic Deployment
1. Push changes to `main` branch
2. GitHub Actions automatically detects changes
3. Builds and deploys affected applications
4. Verifies deployment success

### Manual Deployment
1. Go to GitHub Actions tab
2. Select the relevant workflow
3. Click "Run workflow"
4. Choose the `main` branch
5. Click "Run workflow"

## 🏗️ Build Process

### Frontend (Next.js)
1. Install dependencies (`npm ci`)
2. Build Next.js app (`npm run build`)
3. Create deployment package with:
   - Built `.next` folder
   - Source code (`pages`, `components`, `styles`, etc.)
   - Production dependencies
   - Server files (`server-azure.js`, `startup.js`)
   - Configuration files

### Backend (Express.js + TypeScript)
1. Install dependencies (`npm ci`)
2. Compile TypeScript (`npm run build`)
3. Create deployment package with:
   - Built `dist` folder
   - Production dependencies
   - Server files (`server.js`, `startup.sh`)
   - Configuration files

## 🐛 Troubleshooting

### Common Issues

#### App Not Starting
1. Check Azure Portal → App Service → Log Stream
2. Verify environment variables are set
3. Ensure startup command is correct
4. Check if all required files are deployed

#### Build Failures
1. Check GitHub Actions logs
2. Verify dependencies in `package.json`
3. Ensure TypeScript compilation passes locally
4. Check for missing environment variables

#### API Connectivity Issues
1. Verify API URL in frontend environment variables
2. Check CORS configuration in API
3. Test API endpoints directly
4. Verify database connection

### Health Check Endpoints
- **API Health**: `GET /api/health`
- **Frontend**: Access the home page

## 📊 Monitoring

### Azure Portal Monitoring
1. Go to Azure Portal → App Services
2. Select your app service
3. Navigate to Monitoring → Metrics
4. Set up alerts for CPU, Memory, and HTTP errors

### Log Streaming
1. Azure Portal → App Service → Monitoring → Log stream
2. Real-time logs for debugging

## 🚀 Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are configured in Azure
- [ ] GitHub secrets are properly set
- [ ] Database is accessible from Azure
- [ ] API endpoints are tested locally
- [ ] Frontend builds successfully
- [ ] Backend TypeScript compiles without errors
- [ ] CORS is configured for the frontend domain

## 🔗 Useful Commands

### Test API Health
```bash
curl https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/health
```

### Test Frontend
```bash
curl https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
```

### Local Development
```bash
# Start frontend
cd apps/web && npm run dev

# Start backend
cd apps/api && npm run dev
```

## 📞 Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Review Azure App Service logs
3. Verify all configurations match this guide
4. Test locally first before deploying

---

**Note**: This deployment is configured for the staging environment. For production deployment, ensure you update the URLs and environment variables accordingly.
