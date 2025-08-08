# CampusPe Azure Deployment Guide

## Overview

This guide will help you deploy the CampusPe platform (API + Web) to Azure App Services successfully.

## Prerequisites

✅ Azure resources created:

- `campuspe-api-staging` (App Service)
- `campuspe-web-staging` (App Service)
- `campuspe-staging` (Resource group)
- `campuspe-plan` (App Service plan)

## Step 1: Configure Azure App Services

### For API Service (campuspe-api-staging):

1. **Runtime Configuration:**
   - Go to Configuration > General settings
   - Set Node.js version: `20-lts`
   - Startup Command: `startup.sh`

2. **Environment Variables:**
   Go to Configuration > Application settings and add these:

   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campuspe-staging
   # Azure Linux web apps listen on port 8080
   PORT=8080
   HOST=0.0.0.0
   NODE_ENV=production
   CORS_ORIGIN=https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
   JWT_SECRET=your-super-secure-jwt-secret-for-staging
   CLAUDE_API_KEY=your-claude-api-key
   BUNNY_STORAGE_ZONE_NAME=your-storage-zone
   BUNNY_STORAGE_ACCESS_KEY=your-access-key
   BUNNY_CDN_URL=https://your-zone.b-cdn.net
   WABB_API_KEY=your-wabb-api-key
    WABB_WEBHOOK_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/webhook/whatsapp
   ```

### For Web Service (campuspe-web-staging):

1. **Runtime Configuration:**
   - Go to Configuration > General settings
   - Set Node.js version: `20-lts`
   - Startup Command: `startup.sh`

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=8080
   NEXT_PUBLIC_API_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
   NEXT_TELEMETRY_DISABLED=1
   ```

## Step 2: Set up MongoDB Atlas

1. Create a MongoDB Atlas cluster (if not already done)
2. Create a database user for the staging environment
3. Whitelist Azure IP ranges or use 0.0.0.0/0 for testing
4. Get the connection string and update MONGODB_URI

## Step 3: Configure GitHub Secrets

The deployment workflows need these secrets in your GitHub repository:

### API Service Secrets:

- `AZUREAPPSERVICE_CLIENTID_8A6DED1EC9FF4D6DBF9BC09565C923D6`
- `AZUREAPPSERVICE_TENANTID_6F962B613A624D3582F2985BCDA08CE8`
- `AZUREAPPSERVICE_SUBSCRIPTIONID_AE3ECD9C02CC4AD296820DF8B2D5C91F`

### Web Service Secrets:

- `AZUREAPPSERVICE_CLIENTID_EE222AFA16FA4A5DA06DD5312531E619`
- `AZUREAPPSERVICE_TENANTID_7A15C7020EEA4011BEFA4FD44BD576D8`
- `AZUREAPPSERVICE_SUBSCRIPTIONID_6C89CA2016E747AB8F7F6250858F9AC3`

## Step 4: Deploy

1. **Automatic Deployment:**
   - Push changes to the `main` branch
   - GitHub Actions will automatically build and deploy

2. **Manual Deployment:**
   - Go to GitHub > Actions
   - Select the appropriate workflow
   - Click "Run workflow"

## Step 5: Verify Deployment

### API Health Check:

Visit: `https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health`

### Web Application:

Visit: `https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net`

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check if all dependencies are properly defined in package.json
   - Ensure TypeScript builds successfully locally

2. **Runtime Errors:**
   - Check Application logs in Azure Portal
   - Verify environment variables are set correctly
   - Ensure MongoDB connection string is valid

3. **CORS Issues:**
   - Verify CORS_ORIGIN is set to the correct web app URL
   - Check that both HTTP and HTTPS are handled

### Monitoring:

- Use Azure Application Insights for monitoring
- Check logs in Azure Portal > App Service > Log stream

## Security Considerations

1. **Secrets Management:**
   - Never commit sensitive data to the repository
   - Use Azure Key Vault for production secrets

2. **Database Security:**
   - Use strong passwords for MongoDB
   - Restrict IP access to known Azure ranges

3. **SSL/TLS:**
   - Azure App Service provides free SSL certificates
   - Ensure all communication uses HTTPS

## Performance Optimization

1. **Azure App Service Plan:**
   - Monitor resource usage
   - Scale up/out as needed

2. **Database:**
   - Monitor MongoDB Atlas performance
   - Consider connection pooling optimization

3. **CDN:**
   - Use Bunny CDN for static assets
   - Configure proper caching headers

## Next Steps

After successful deployment:

1. Set up Azure Application Insights for monitoring
2. Configure custom domains (if needed)
3. Set up staging/production pipelines
4. Configure backup strategies
5. Set up alerts for application health

## Support

If you encounter issues:

1. Check Azure App Service logs
2. Review GitHub Actions build logs
3. Verify all environment variables
4. Test database connectivity
5. Check network security rules
