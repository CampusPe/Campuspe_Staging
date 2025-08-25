# BunnyCDN Authentication Fix Guide

After thorough testing, we've determined that the issue is with the BunnyCDN access key. The current key appears to be in an incorrect format or has been invalidated.

## Current Configuration

```
BUNNY_STORAGE_ZONE_NAME=campuspe-resumes
BUNNY_STORAGE_ACCESS_KEY=a5f88a960fca48f4b3fe5052de3470624e95
BUNNY_CDN_URL=https://campuspe-resumes-cdn.b-cdn.net/
```

## Steps to Fix

1. **Log into your BunnyCDN dashboard** at https://panel.bunny.net/

2. **Navigate to your Storage Zone**:
   - Go to the left menu and select "Edge Storage"
   - Find and click on your storage zone named "campuspe-resumes"

3. **Generate a new access key**:
   - Look for the "FTP & API Access" section or tab
   - Click on "Reset Password" or "Generate New Key"
   - Copy the newly generated access key

4. **Update your .env file**:
   - Open `apps/api/.env`
   - Replace the value of `BUNNY_STORAGE_ACCESS_KEY` with your new access key
   - Make sure there are no spaces or quotes around the key

   ```
   BUNNY_STORAGE_ACCESS_KEY=your_new_access_key_here
   ```

5. **Verify correct format**:
   - BunnyCDN access keys are typically alphanumeric strings
   - They should NOT contain hyphens
   - They should be around 32-64 characters in length

6. **Restart your application**:
   - Restart any services that use the BunnyCDN integration

## Testing the Fix

After updating your access key, you can verify it's working by running:

```bash
node test-bunny-simple.js
```

## Common Issues

1. **Incorrect Storage Zone Name**:
   - Double-check that `campuspe-resumes` is the exact name of your storage zone

2. **Permissions Issues**:
   - Ensure your storage zone has proper permissions set in the BunnyCDN dashboard
   - Check that "Allow Browser Uploads" is enabled if needed

3. **CDN URL Format**:
   - Verify that the CDN URL format is correct: `https://campuspe-resumes-cdn.b-cdn.net/`
   - It should match the format shown in your BunnyCDN dashboard

## Integration Code Check

The current implementation code for BunnyCDN is correct, assuming it:

1. Sets the `AccessKey` header with the access key
2. Uses the correct storage endpoint format: `https://storage.bunnycdn.com/{storageZone}/{path}`
3. Uses the correct CDN URL format for downloads

If you continue to experience issues after generating a new access key, please review the official BunnyCDN documentation at https://docs.bunny.net/reference/storage-api
