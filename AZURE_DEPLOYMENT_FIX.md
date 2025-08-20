# Azure API Deployment Fix Guide

## Issues Fixed

### 1. Missing Module Error
- **Problem**: `Cannot find module '../services/mock-whatsapp'`
- **Solution**: Converted `mock-whatsapp.js` to `mock-whatsapp.ts` with proper TypeScript exports
- **Files Changed**: 
  - `src/services/mock-whatsapp.js` → `src/services/mock-whatsapp.ts`
  - `src/routes/wabb-resume.ts` (updated import statement)

### 2. Deprecated Packages
- **Problem**: npm warnings about deprecated packages causing deployment issues
- **Solution**: Updated package.json dependencies
- **Changes**:
  - `multer`: `^1.4.5-lts.1` → `^2.0.1`
  - Added `postinstall` script to ensure build runs after npm install

### 3. Azure Deployment Configuration
- **Problem**: Incorrect Azure deployment settings
- **Solution**: Updated `.deployment` file with proper configuration
- **Changes**:
  - Set `PROJECT=apps/api`
  - Enabled Oryx build with `ENABLE_ORYX_BUILD=true`
  - Set Node.js version to `~20`

### 4. Web.config Optimization
- **Problem**: Basic IIS configuration causing performance issues
- **Solution**: Enhanced web.config with proper IISNode settings
- **Improvements**:
  - Added request limits and timeout settings
  - Configured logging and error handling
  - Set proper process management

## Deployment Steps

### 1. Prepare Local Environment
```bash
# Navigate to API directory
cd apps/api

# Install dependencies and build
npm install
npm run build

# Verify build
./verify-deployment.sh
```

### 2. Commit Changes
```bash
git add .
git commit -m "Fix: Azure deployment issues - missing modules and configuration"
git push origin main
```

### 3. Deploy to Azure
Deploy using your preferred method:
- Azure CLI
- VS Code Azure extension
- GitHub Actions
- Azure DevOps

### 4. Verify Deployment
After deployment, check:
1. **Application URL**: http://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
2. **Health Endpoint**: `/health`
3. **Application Logs** in Azure portal

## Environment Variables Required

Ensure these are set in Azure App Service Configuration:

### Database
- `MONGODB_URI`: MongoDB connection string
- `DB_NAME`: Database name

### Authentication
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token expiration time

### External Services
- `CLAUDE_API_KEY`: Anthropic Claude API key
- `WABB_API_KEY`: WABB WhatsApp service key
- `WABB_WEBHOOK_URL`: WABB webhook URL

### Azure Services
- `AZURE_STORAGE_CONNECTION_STRING`: Azure storage connection
- `AZURE_COMMUNICATION_CONNECTION_STRING`: Azure communication services

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Application Won't Start
1. Check Azure Application Logs
2. Verify environment variables are set
3. Check database connectivity
4. Verify Node.js version compatibility

### Module Not Found Errors
- Ensure all TypeScript files are properly compiled
- Check that all dependencies are in package.json
- Verify import/export statements are correct

## Files Modified
1. `apps/api/package.json` - Updated dependencies and scripts
2. `apps/api/src/services/mock-whatsapp.ts` - Converted to TypeScript
3. `apps/api/src/routes/wabb-resume.ts` - Updated import
4. `apps/api/web.config` - Enhanced IIS configuration
5. `.deployment` - Fixed Azure deployment settings
6. `package.json` (root) - Added postinstall script

## Testing Commands
```bash
# Local development
npm run dev

# Build verification
npm run build && npm start

# Deployment verification
./verify-deployment.sh
```
