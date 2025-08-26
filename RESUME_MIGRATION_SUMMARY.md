# Resume Storage Migration to Bunny.net

## Overview

This document outlines the changes made to migrate resume storage from the old Azure API endpoint format to Bunny.net CDN storage with the format: `https://campuspe-resumes-cdn.b-cdn.net/resumes/...`

## Changes Made

### 1. Enhanced Bunny Storage Service

**File**: `/apps/api/src/services/bunny-storage.service.ts`

- ✅ Added `uploadPDFWithRetry()` method with exponential backoff retry logic
- ✅ Improved error handling and logging
- ✅ Maintains existing functionality while adding reliability

### 2. Fixed Hardcoded Azure URLs

**File**: `/apps/api/src/routes/generated-resume.ts`

- ❌ **FIXED**: Removed hardcoded `campuspe-api-staging.azurewebsites.net` URL
- ✅ Now prioritizes Bunny.net cloud URLs over fallback URLs
- ✅ Added proper import for ResumeUrlUtils

### 3. Updated AI Resume Builder

**File**: `/apps/api/src/routes/ai-resume-builder.ts`

- ✅ Updated to use `uploadPDFWithRetry()` instead of basic `uploadPDF()`
- ✅ Added URL usage logging for monitoring
- ✅ Improved reliability for Bunny.net uploads

### 4. Enhanced Generated Resume Service

**File**: `/apps/api/src/services/generated-resume.service.ts`

- ✅ Updated to use retry logic for Bunny.net uploads
- ✅ Prioritizes cloud URLs in student resume history
- ✅ Added proper URL utilities integration

### 5. Updated WABB Complete Route

**File**: `/apps/api/src/routes/wabb-complete.ts`

- ✅ Added retry logic for Bunny.net uploads
- ✅ Improved fallback URL handling

### 6. Created URL Management Utilities

**File**: `/apps/api/src/utils/resume-url.utils.ts`

- ✅ **NEW**: `ResumeUrlUtils` class for consistent URL handling
- ✅ URL validation and format checking
- ✅ Priority-based URL selection (Bunny.net first, API fallback)
- ✅ URL usage logging for monitoring

### 7. Created Migration Tools

**File**: `/apps/api/src/utils/resume-url-migration.ts`

- ✅ **NEW**: Tools to scan and fix existing resume URLs
- ✅ Analytics for URL format distribution
- ✅ Automated fixing of incorrect URLs in student history

### 8. Added Migration API Routes

**File**: `/apps/api/src/routes/resume-migration.ts`

- ✅ **NEW**: `/api/resume-migration/scan-urls` - Analyze all resume URLs
- ✅ **NEW**: `/api/resume-migration/scan-student-history` - Check student resume history
- ✅ **NEW**: `/api/resume-migration/fix-student-urls` - Fix incorrect URLs

## Environment Variables (Already Configured)

The following Bunny.net credentials are already properly configured in your `.env` file:

```env
BUNNY_STORAGE_ZONE_NAME=campuspe-resumes
BUNNY_STORAGE_ACCESS_KEY=7deab40f09bf4f47aae1c96a0bd720ec49cf
BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com
BUNNY_CDN_URL=https://campuspe-resumes-cdn.b-cdn.net/
```

## URL Format Changes

### ❌ Old Format (Being Eliminated)

```
https://campuspe-api-staging.azurewebsites.net/api/ai-resume-builder/download-pdf-public/resume_1756112503678_4cgchgvhm
```

### ✅ New Format (Target)

```
https://campuspe-resumes-cdn.b-cdn.net/resumes/resume_1756112503678_4cgchgvhm/Resume_AI_Generated_1756112503678.pdf
```

### ⚠️ Fallback Format (Acceptable)

```
http://localhost:5001/api/ai-resume-builder/download-pdf-public/resume_1756112503678_4cgchgvhm
```

## Benefits

1. **🚀 Faster Downloads**: Bunny.net CDN provides global edge caching
2. **💰 Cost Effective**: Reduces server load and bandwidth costs
3. **🔄 Better Reliability**: Retry logic ensures uploads succeed
4. **📊 Monitoring**: URL usage logging helps track adoption
5. **🔧 Easy Migration**: Tools to fix existing data automatically

## Migration Process

1. **Immediate Effect**: All new resumes will be stored in Bunny.net
2. **Existing Resumes**: Use migration tools to scan and fix
3. **Gradual Migration**: Old URLs will continue to work as fallbacks
4. **Monitoring**: Track URL usage to measure migration progress

## Running Migration Tools

### Check URL Status

```bash
GET /api/resume-migration/scan-urls
```

### Check Student History

```bash
GET /api/resume-migration/scan-student-history
```

### Fix URLs (Run Once)

```bash
POST /api/resume-migration/fix-student-urls
```

## Impact Assessment

- ✅ **Backward Compatibility**: Maintained through fallback URLs
- ✅ **Zero Downtime**: Changes are additive, not breaking
- ✅ **Gradual Migration**: Old URLs continue to work
- ✅ **Performance Gain**: New resumes immediately benefit from CDN
- ✅ **Cost Reduction**: Reduced server bandwidth usage

## Next Steps

1. ✅ Deploy these changes to production
2. 🔄 Run migration tools to fix existing URLs
3. 📊 Monitor URL usage logs
4. 🎯 Verify new resumes are using Bunny.net URLs
5. 📈 Track performance improvements

## Verification Commands

After deployment, verify the changes are working:

```bash
# Test AI resume generation
POST /api/ai-resume-builder/generate

# Check URL format in response - should be Bunny.net URL
# Example response should include:
# "pdfUrl": "https://campuspe-resumes-cdn.b-cdn.net/resumes/..."
```
