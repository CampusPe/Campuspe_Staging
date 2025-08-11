# WABB Webhook Configuration - Azure Environment Variables Setup

## Issue Identified
The OTP functionality is failing because WABB webhook URLs are not configured in Azure App Service environment variables.

## Required Environment Variables

Add these to Azure App Service Configuration for `campuspe-api-staging`:

### Primary WABB Configuration
```
WABB_WEBHOOK_URL_OTP=https://webhook.wabb.in/your-webhook-id-for-otp
WABB_WEBHOOK_URL_JOBS=https://webhook.wabb.in/your-webhook-id-for-jobs  
WABB_WEBHOOK_URL_RESUME=https://webhook.wabb.in/your-webhook-id-for-resume
WABB_WEBHOOK_URL_GENERAL=https://webhook.wabb.in/your-webhook-id-for-general
```

### Optional WABB API (if using direct API instead of webhooks)
```
WABB_API_URL=https://api.wabb.in
WABB_API_KEY=your-wabb-api-key
```

## Azure App Service Configuration Steps

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to App Services → `campuspe-api-staging-hmfjgud5c6a7exe9`
3. In the left menu, click "Configuration"
4. Under "Application settings", click "+ New application setting"
5. Add each environment variable:
   - Name: `WABB_WEBHOOK_URL_OTP`
   - Value: `your-actual-webhook-url`
6. Click "Save" after adding all variables
7. The app will automatically restart

## Testing Commands

After configuration, test with:

```bash
# Test OTP sending
curl -X POST "https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919999999999",
    "userType": "student"
  }'
```

## Expected Response
Should return success instead of "WABB webhook URL not configured"

## Current Status
❌ **WABB webhook URLs not configured in Azure**
❌ **OTP sending failing**
✅ **API backend is running and responsive**
✅ **Template literal fixes deployed**

## Immediate Action Required
Configure the WABB webhook URLs in Azure App Service environment variables to enable OTP functionality.
