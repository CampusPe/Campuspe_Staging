# BunnyCDN Integration - Complete Fix Guide

## Problem Summary

The BunnyCDN integration for cloud storage of resume PDFs is not working due to authentication failures. The primary issue is with the BunnyCDN access key format in the environment configuration.

## Root Causes Identified

1. **Incorrect Access Key Format**: The BunnyCDN access key contains hyphens, which is causing authentication failures with the BunnyCDN API.

2. **Possible Expired or Invalid Key**: The current access key might have been invalidated or expired.

## Complete Solution

### Step 1: Regenerate BunnyCDN Access Key

1. Log into your BunnyCDN dashboard at https://panel.bunny.net/
2. Navigate to "Edge Storage" > "campuspe-resumes" storage zone
3. Go to the "FTP & API Access" section
4. Click "Reset Password" to generate a new access key
5. Copy the new access key (this will be a plain alphanumeric string without hyphens)

### Step 2: Update Environment Configuration

1. Open your environment configuration file:
   ```bash
   nano apps/api/.env
   ```

2. Update the `BUNNY_STORAGE_ACCESS_KEY` with your new key:
   ```
   BUNNY_STORAGE_ACCESS_KEY=your_new_key_without_hyphens
   ```

3. Verify other BunnyCDN settings:
   ```
   BUNNY_STORAGE_ZONE_NAME=campuspe-resumes
   BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com
   BUNNY_CDN_URL=https://campuspe-resumes-cdn.b-cdn.net/
   ```

### Step 3: Verify the Fix

Run the verification script:
```bash
./verify-new-bunnycdn-key.sh
```

This script will:
- Test the connection to BunnyCDN with your new key
- Upload a test file to verify write permissions
- Check if the file can be downloaded from the CDN URL

### Step 4: Update Code Implementation

The fixed `BunnyStorageService.js` file has been created. It includes:
- Proper handling of the BunnyCDN access key
- Correct URL construction for uploads and downloads
- Enhanced error logging for troubleshooting

To use this fixed implementation:

1. Replace your current implementation with the fixed version:
   ```bash
   cp BunnyStorageService-fixed.js apps/api/src/services/BunnyStorageService.js
   ```

2. Restart your API server to apply the changes:
   ```bash
   cd apps/api && npm run start
   ```

### Step 5: Test the Full Integration

1. Run the integration test script to verify the complete flow:
   ```bash
   node verify-bunnycdn-integration.js
   ```

2. This will test:
   - Resume generation
   - PDF upload to BunnyCDN
   - CloudUrl generation in API response
   - Download from CloudUrl

## Environment Variables Reference

For proper BunnyCDN integration, ensure these environment variables are correctly set:

```
BUNNY_STORAGE_ZONE_NAME=campuspe-resumes
BUNNY_STORAGE_ACCESS_KEY=your_new_key_without_hyphens
BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com
BUNNY_CDN_URL=https://campuspe-resumes-cdn.b-cdn.net/
```

## Verification Tools Created

We've created several tools to help verify and fix the BunnyCDN integration:

1. `fix-bunnycdn-config.sh` - Fixes hyphenated access keys
2. `test-bunny-curl.sh` - Tests BunnyCDN upload using cURL
3. `fix-bunnycdn-auth.js` - Tests different authentication methods
4. `test-bunny-simple.js` - Tests using the official BunnyCDN SDK
5. `verify-new-bunnycdn-key.sh` - Interactive tool to verify a new access key
6. `verify-bunnycdn-integration.js` - Tests the complete resume generation and upload flow

## Common Errors and Solutions

### 401 Unauthorized

**Causes:**
- Invalid access key
- Incorrectly formatted access key
- Storage zone permissions issues

**Solutions:**
- Regenerate a new access key
- Ensure the access key doesn't contain hyphens
- Verify storage zone permissions in BunnyCDN dashboard

### Failed Uploads

**Causes:**
- Network connectivity issues
- Insufficient permissions
- Incorrect storage zone name

**Solutions:**
- Check network connectivity to BunnyCDN
- Verify storage zone name is spelled correctly
- Check if "Allow Browser Uploads" is enabled if needed

### CDN URL Not Working

**Causes:**
- CDN not properly linked to storage
- Incorrect CDN URL format
- File not properly uploaded

**Solutions:**
- Verify CDN URL format in BunnyCDN dashboard
- Ensure the file was successfully uploaded before attempting download
- Check CDN configuration in BunnyCDN dashboard

## BunnyCDN API Documentation

For more information on the BunnyCDN API, refer to the official documentation:

- Storage API: https://docs.bunny.net/reference/storage-api
- Authentication: https://docs.bunny.net/reference/storage-api#authentication
