# Azure Deployment Configuration

## Azure App Services Configuration

### API Service (campuspe-api-staging)
- **Runtime**: Node.js 20 LTS
- **Startup Command**: `node dist/app.js`
- **Health Check**: `/api/health`
- **Scale**: Standard S1 (1 CPU, 1.75GB RAM)

### Web Service (campuspe-web-staging)  
- **Runtime**: Node.js 20 LTS
- **Startup Command**: `node server.js`
- **Health Check**: `/`
- **Scale**: Standard S1 (1 CPU, 1.75GB RAM)

## Environment Variables

### API Service Environment Variables
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campuspe
JWT_SECRET=your-256-bit-secret-key
ANTHROPIC_API_KEY=sk-ant-api03-your-claude-key
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=your-key
AZURE_EMAIL_FROM_ADDRESS=noreply@campuspe.com
NODE_ENV=production
PORT=80
WEBSITE_HOSTNAME=campuspe-api-staging.azurewebsites.net
```

### Web Service Environment Variables
```
NEXT_PUBLIC_API_URL=https://campuspe-api-staging.azurewebsites.net
NEXT_PUBLIC_APP_NAME=CampusPe
NODE_ENV=production
PORT=80
WEBSITE_HOSTNAME=campuspe-web-staging.azurewebsites.net
```

## Deployment Steps

1. **Azure Resource Setup**:
   - Create two App Services (API and Web)
   - Configure Node.js 20 runtime
   - Set environment variables

2. **GitHub Secrets Configuration**:
   - Add `AZURE_API_PUBLISH_PROFILE`
   - Add `AZURE_WEB_PUBLISH_PROFILE`

3. **Deploy**:
   - Push to main branch triggers automatic deployment
   - Monitor in GitHub Actions tab

## Monitoring

### Application Insights
- Performance monitoring
- Error tracking
- Custom telemetry

### Log Streaming
- Real-time logs from Azure Portal
- Application logs and HTTP logs
- Error diagnostics

## Troubleshooting

### Common Issues:
1. **502 Bad Gateway**: Check startup command and PORT environment variable
2. **Build Failures**: Verify Node.js version and dependencies
3. **Database Connection**: Ensure MongoDB Atlas allows Azure IPs
4. **Environment Variables**: Verify all required variables are set

### Debug Commands:
```bash
# Check application logs
az webapp log tail --name campuspe-api-staging --resource-group your-resource-group

# Restart application
az webapp restart --name campuspe-api-staging --resource-group your-resource-group
```
