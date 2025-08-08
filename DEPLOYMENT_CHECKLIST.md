# CampusPe Azure Deployment - Action Items

## ✅ Completed

- Fixed GitHub Actions workflows for proper monorepo deployment
- Created Azure-specific configuration files (web.config)
- Added startup scripts for both API and Web services
- Created environment variable templates
- Updated Next.js configuration for Azure compatibility
- Added deployment verification script

## 🔧 Required Azure Configuration

### 1. API Service (campuspe-api-staging)

In Azure Portal > App Services > campuspe-api-staging > Configuration:

**General Settings:**

- Node.js version: `20-lts`
- Startup Command: `startup.sh`

**Application Settings (Environment Variables):**

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campuspe-staging
# Azure Linux web apps default to port 8080
PORT=8080
HOST=0.0.0.0
NODE_ENV=production

JWT_SECRET=your-super-secure-jwt-secret
CLAUDE_API_KEY=your-claude-api-key
BUNNY_STORAGE_ZONE_NAME=your-storage-zone
BUNNY_STORAGE_ACCESS_KEY=your-access-key
BUNNY_CDN_URL=https://your-zone.b-cdn.net
WABB_API_KEY=your-wabb-api-key
 WABB_WEBHOOK_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/webhook/whatsapp
```

### 2. Web Service (campuspe-web-staging)

In Azure Portal > App Services > campuspe-web-staging > Configuration:

**General Settings:**

- Node.js version: `20-lts`
- Startup Command: `startup.sh`

**Application Settings:**



## 🔑 GitHub Secrets Setup

The following secrets should already be configured in your GitHub repository (they appear to be set up from the workflows):

### API Secrets:

- AZUREAPPSERVICE_CLIENTID_8A6DED1EC9FF4D6DBF9BC09565C923D6
- AZUREAPPSERVICE_TENANTID_6F962B613A624D3582F2985BCDA08CE8
- AZUREAPPSERVICE_SUBSCRIPTIONID_AE3ECD9C02CC4AD296820DF8B2D5C91F

### Web Secrets:

- AZUREAPPSERVICE_CLIENTID_EE222AFA16FA4A5DA06DD5312531E619
- AZUREAPPSERVICE_TENANTID_7A15C7020EEA4011BEFA4FD44BD576D8
- AZUREAPPSERVICE_SUBSCRIPTIONID_6C89CA2016E747AB8F7F6250858F9AC3

## 🚀 Deployment Process

1. **Configure Azure Environment Variables** (as listed above)
2. **Set up MongoDB Atlas** database
3. **Push to main branch** - GitHub Actions will automatically deploy
4. **Verify deployment** using `./verify-deployment.sh`

## 🐛 Common Issues & Solutions

### Build Failures:

- Ensure all dependencies are in package.json
- Check TypeScript compilation errors locally first

### Runtime Errors:

- Verify all environment variables are set in Azure
- Check MongoDB connection string format
- Review Azure App Service logs

### CORS Issues:

- Ensure CORS_ORIGIN matches exact web app URL
- Include both HTTP and HTTPS if needed

## 📊 Monitoring

After deployment, check:

- API Health: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health
- Web App: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
- Azure Portal logs for any errors

## 🔄 Next Deployment

Once environment variables are configured in Azure, future deployments will be automatic when you push to the main branch. The workflows will only trigger when files in the respective app directories change.

## 📝 Files Modified/Created:

- `.github/workflows/main_campuspe-api-staging.yml` - Fixed API deployment
- `.github/workflows/main_campuspe-web-staging.yml` - Fixed Web deployment
- `apps/api/web.config` - Azure IIS configuration
- `apps/web/web.config` - Azure IIS configuration
- `apps/api/startup.sh` - Azure startup script
- `apps/web/startup.sh` - Azure startup script
- `apps/api/.env.azure` - Environment template
- `apps/web/.env.azure` - Environment template
- `apps/web/server.js` - Custom Next.js server
- `apps/web/next.config.js` - Updated for Azure compatibility
- `AZURE_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `verify-deployment.sh` - Deployment verification script
- `setup.sh` - Local development setup script
