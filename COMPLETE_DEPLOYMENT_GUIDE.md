# 🚀 Complete CampusPe Azure Deployment Guide

## 📋 Current Status Overview

Based on our diagnostics:
- ✅ **API Service**: Working perfectly (200 responses)
- ❌ **Web Service**: 503 error (startup failure)
- ✅ **Infrastructure**: Azure services properly configured
- ❌ **Environment Variables**: Missing critical configuration

---

## 🎯 PHASE 1: Immediate Fix (Web Service 503 Error)

### Step 1: Configure Web Service Environment Variables

**Go to Azure Portal:**
1. Open https://portal.azure.com
2. Navigate to **App Services** → **campuspe-web-staging**
3. Click **Configuration** → **Application settings**

**Add these environment variables (click "New application setting" for each):**

```
Name: PORT
Value: 8080
```

```
Name: NODE_ENV
Value: production
```

```
Name: NEXT_PUBLIC_API_URL
Value: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
```

```
Name: WEBSITES_ENABLE_APP_SERVICE_STORAGE
Value: false
```

```
Name: WEBSITE_RUN_FROM_PACKAGE
Value: 1
```

```
Name: NEXT_TELEMETRY_DISABLED
Value: 1
```

**Click "Save" after adding all variables**

### Step 2: Configure API Service Environment Variables

**Go to Azure Portal:**
1. Navigate to **App Services** → **campuspe-api-staging**
2. Click **Configuration** → **Application settings**

**Verify/Add these environment variables:**

```
Name: PORT
Value: 8080
```

```
Name: HOST
Value: 0.0.0.0
```

```
Name: NODE_ENV
Value: production
```

```
Name: CORS_ORIGIN
Value: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net
```

**Add your database and service configurations:**

```
Name: MONGODB_URI
Value: [Your MongoDB connection string]
```

```
Name: JWT_SECRET
Value: [Your JWT secret key]
```

### Step 3: Restart Both Services

1. **Web Service**: App Services → campuspe-web-staging → Overview → **Restart**
2. **API Service**: App Services → campuspe-api-staging → Overview → **Restart**
3. **Wait 5-10 minutes** for full startup

---

## 🔧 PHASE 2: Verify Deployment Status

### Check Service Health

Run our verification script:

```bash
./verify-azure-deployment.sh
```

**Current Status (as of verification):**
- ✅ API Health Status: 200
- ✅ API Root Status: 200  
- ❌ Web App Status: 503
- ✅ CORS Preflight Status: 204

**This shows the API is working but web service needs environment variables.**

---

## 📊 PHASE 3: Monitor and Debug

### Step 1: Monitor Startup Logs

**For Web Service:**
1. Azure Portal → campuspe-web-staging → Monitoring → **Log stream**
2. Watch for startup messages:
   - ✅ "SERVER STARTED SUCCESSFULLY"
   - ✅ "Server listening on http://0.0.0.0:8080"
   - ❌ Any error messages

**For API Service:**
1. Azure Portal → campuspe-api-staging → Monitoring → **Log stream**
2. Watch for startup messages

### Step 2: Common Error Patterns to Look For

**Web Service Errors:**
- `ENOENT: no such file or directory, open '.next/BUILD_ID'` → Build artifacts missing
- `Cannot find module 'next'` → Dependencies not installed
- `Port already in use` → Port configuration issue
- `Application startup failed` → Environment variable issue

**API Service Errors:**
- `EADDRINUSE` → Port already in use
- `MongoDB connection failed` → Database connection issue
- `CORS error` → Origin configuration problem

---

## 🚀 PHASE 4: Complete Application Setup

### Step 1: Database Configuration

**If using MongoDB Atlas:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campuspe-staging?retryWrites=true&w=majority
```

**If using local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/campuspe-staging
```

### Step 2: Authentication & Security

**API Service additional variables:**
```
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

### Step 3: Optional Services Configuration

**AI Services (if using):**
```
CLAUDE_API_KEY=your-claude-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

**File Storage (if using Bunny CDN):**
```
BUNNY_STORAGE_ZONE_NAME=your-storage-zone
BUNNY_STORAGE_ACCESS_KEY=your-access-key
BUNNY_CDN_URL=https://your-zone.b-cdn.net
```

**WhatsApp Integration (if using WABB):**
```
WABB_API_KEY=your-wabb-api-key
WABB_WEBHOOK_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/webhook/whatsapp
```

---

## 🔄 PHASE 5: Deployment Automation

### GitHub Actions Configuration

Your deployment should be automated. Check your GitHub repository for:

**File: `.github/workflows/deploy.yml`**

**Required build steps for Web service:**
```yaml
- name: Install dependencies
  run: |
    cd apps/web
    npm install

- name: Build Next.js application
  run: |
    cd apps/web
    npm run build
  env:
    NEXT_PUBLIC_API_URL: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net

- name: Deploy to Azure
  uses: azure/webapps-deploy@v2
  with:
    app-name: campuspe-web-staging
    package: apps/web
```

**Required build steps for API service:**
```yaml
- name: Install dependencies
  run: |
    cd apps/api
    npm install

- name: Build TypeScript
  run: |
    cd apps/api
    npm run build

- name: Deploy to Azure
  uses: azure/webapps-deploy@v2
  with:
    app-name: campuspe-api-staging
    package: apps/api
```

---

## 🧪 PHASE 6: Testing & Validation

### Step 1: Automated Testing

Run the comprehensive test suite:

```bash
./comprehensive-test.sh
```

This will test:
- ✅ Service health and availability
- ✅ API endpoint functionality
- ✅ CORS configuration
- ✅ Authentication flow
- ✅ Response times and performance

### Step 2: Manual Testing Checklist

**Test Core Functionality:**

1. **User Registration**
   - Visit: `https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net/register`
   - Test student, college, and recruiter registration

2. **User Authentication**
   - Test login/logout functionality
   - Verify JWT token handling
   - Test password reset flow

3. **Main Features**
   - Job listings and applications
   - Resume upload and AI analysis
   - College dashboard functionality
   - Admin panel access

### Step 3: Performance Testing

**Load Testing Commands:**
```bash
# Test API under load
ab -n 100 -c 10 https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health

# Test web application under load (after fixing 503)
ab -n 100 -c 10 https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net/
```

---

## 🛠️ PHASE 7: Troubleshooting Common Issues

### Issue 1: Web Service 503 Error (Current Issue)

**Symptoms:** Web returns 503 Service Unavailable
**Solution:**
1. Add environment variables (see Phase 1)
2. Restart service
3. Check logs for startup errors
4. Verify build artifacts exist

### Issue 2: CORS Errors

**Symptoms:** "Access to fetch blocked by CORS policy"
**Solution:**
1. Set `CORS_ORIGIN` in API service
2. Ensure exact URL match (including https://)
3. Restart API service

### Issue 3: Database Connection Issues

**Symptoms:** API returns 500 errors, "MongoDB connection failed"
**Solution:**
1. Verify `MONGODB_URI` is correct
2. Check database user permissions
3. Ensure IP whitelist includes Azure IPs

### Issue 4: Build Failures

**Symptoms:** Deployment succeeds but app doesn't start
**Solution:**
1. Check GitHub Actions build logs
2. Verify `package.json` scripts
3. Ensure dependencies are correctly specified

### Issue 5: Environment Variables Not Loading

**Symptoms:** App behavior suggests missing config
**Solution:**
1. Use "Application settings" not "Connection strings"
2. Restart service after adding variables
3. For Next.js: Use `NEXT_PUBLIC_` prefix for client-side variables

---

## 📋 PHASE 8: Production Readiness Checklist

### Security Configuration
- [ ] HTTPS enforced on both services
- [ ] Strong JWT secret configured
- [ ] Database credentials secured
- [ ] CORS properly configured
- [ ] Input validation implemented

### Performance Optimization
- [ ] CDN configured for static assets
- [ ] Database indexes optimized
- [ ] API response caching implemented
- [ ] Image optimization enabled
- [ ] Gzip compression enabled

### Monitoring & Logging
- [ ] Azure Application Insights configured
- [ ] Error tracking implemented
- [ ] Performance monitoring active
- [ ] Log aggregation setup
- [ ] Alerting rules configured

### Backup & Recovery
- [ ] Database backups automated
- [ ] Deployment rollback procedure tested
- [ ] Configuration backup maintained
- [ ] Disaster recovery plan documented

---

## 🚀 PHASE 9: Going Live

### Pre-Launch Steps

1. **Final Testing**
   ```bash
   ./comprehensive-test.sh
   ```

2. **Performance Verification**
   - Response times < 2 seconds
   - 99.9% uptime over 24 hours
   - Load testing completed

3. **Security Scan**
   - SSL certificate valid
   - No security vulnerabilities
   - API rate limiting configured

### Launch Day Checklist

- [ ] DNS records updated (if using custom domain)
- [ ] SSL certificates valid
- [ ] Monitoring dashboards active
- [ ] Support team notified
- [ ] Rollback plan ready

### Post-Launch Monitoring

**First 24 Hours:**
- Monitor error rates
- Check performance metrics
- Verify user registration flow
- Monitor database performance

**First Week:**
- Analyze user behavior
- Monitor resource utilization
- Check for any scaling needs
- Review and fix any reported issues

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review application logs
- Check performance metrics
- Update dependencies if needed
- Backup verification

**Monthly:**
- Security updates
- Performance optimization
- Cost analysis
- Capacity planning

### Emergency Procedures

**If API goes down:**
1. Check Azure Portal → App Services → campuspe-api-staging → Overview
2. Review logs in Log stream
3. Restart service if needed
4. Check environment variables

**If Web goes down:**
1. Check Azure Portal → App Services → campuspe-web-staging → Overview
2. Review logs in Log stream
3. Restart service if needed
4. Verify build artifacts

---

## 🎯 IMMEDIATE NEXT STEPS

**Right now, you need to:**

1. **Add environment variables** to web service (Phase 1)
2. **Restart web service**
3. **Wait 5 minutes**
4. **Run comprehensive test**: `./comprehensive-test.sh`
5. **Verify everything is working**

Once the web service is fixed, you'll have a fully functional deployment! 🚀
