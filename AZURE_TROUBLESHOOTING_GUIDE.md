# 🚨 Azure App Service Troubleshooting Guide

## Common Issues & Solutions

### 1. **Port Configuration Issues**

**Problem**: App not responding on Azure
**Solution**: 
- API must use `PORT=8080` and `HOST=0.0.0.0`
- Web must use `PORT=8080`
- Never use port 80 or 3000 in production

### 2. **CORS Errors**

**Problem**: "Access to fetch at '...' has been blocked by CORS policy"
**Solution**:
```bash
# In API service environment variables:
CORS_ORIGIN=https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
```

### 3. **API Connection Issues**

**Problem**: Web app can't connect to API
**Solution**:
```bash
# In Web service environment variables:
NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
```

### 4. **Environment Variables Not Loading**

**Problem**: Environment variables not available at runtime
**Solution**:
- For Next.js: Variables must start with `NEXT_PUBLIC_` for client-side access
- Restart both services after adding environment variables
- Check "Application settings" not "Connection strings"

### 5. **Build/Startup Issues**

**Problem**: Application fails to start
**Solution**:
- Check `web.config` points to correct entry file
- API: `dist/app.js`
- Web: `server-azure.js`

## Quick Verification Commands

Run these in your local terminal to test:

```bash
# Test API health
curl https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/health

# Test Web app
curl https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net

# Test CORS
curl -X OPTIONS -H "Origin: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net" \
  https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/auth/login
```

## Environment Variables Checklist

### API Service (campuspe-api-staging):
- [ ] `PORT=8080`
- [ ] `HOST=0.0.0.0` 
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN=https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net`
- [ ] Database connection string
- [ ] JWT secret

### Web Service (campuspe-web-staging):
- [ ] `PORT=8080`
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net`

## After Configuration:

1. **Restart both services** in Azure Portal
2. **Wait 2-3 minutes** for deployment
3. **Test with verification script**: `./verify-azure-deployment.sh`
4. **Check browser console** for any remaining errors
