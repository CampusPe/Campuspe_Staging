/**
 * BunnyCDN official SDK implementation for testing and fixing
 * the storage integration.
 */

// Install the official SDK if not already installed
// npm install @bunny.net/storage-sdk

const fs = require('fs');
const path = require('path');
const { BunnyStorageClient, StorageAuthenticationError } = require('@bunny.net/storage-sdk');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(process.cwd(), 'apps/api/.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

console.log('🧪 BunnyCDN Official SDK Test');
console.log('-----------------------------');

// Get credentials from environment
const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
const hostname = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';
const cdnUrl = process.env.BUNNY_CDN_URL;

console.log('Configuration:');
console.log(`- Storage Zone: ${storageZone}`);
console.log(`- Access Key: ${accessKey ? `${accessKey.substring(0, 8)}...` : 'Not set'}`);
console.log(`- Hostname: ${hostname}`);
console.log(`- CDN URL: ${cdnUrl}`);
console.log('-----------------------------');

async function runTest() {
  try {
    // Create a client instance using the official SDK
    const client = new BunnyStorageClient(accessKey, storageZone, {
      region: '', // Empty string means default region
    });

    console.log('✅ Client initialized');
    
    // Create test file
    const testFilePath = path.resolve(process.cwd(), `test-${Date.now()}.txt`);
    const testContent = `This is a test file created at ${new Date().toISOString()}`;
    fs.writeFileSync(testFilePath, testContent);
    console.log(`✅ Created test file: ${testFilePath}`);
    
    // Upload test file
    const remotePath = `/test/test-${Date.now()}.txt`;
    console.log(`🔄 Uploading to ${remotePath}...`);
    
    try {
      await client.uploadFile(testFilePath, remotePath);
      console.log('✅ Upload successful!');
      
      // Test downloading
      const downloadUrl = `${cdnUrl}${remotePath}`;
      console.log(`🔍 Download URL: ${downloadUrl}`);
      
      // List files to verify
      console.log('🔄 Listing files in /test directory...');
      const files = await client.listFiles('/test');
      console.log(`✅ Files in directory: ${files.length}`);
      files.forEach(file => {
        console.log(`- ${file.ObjectName} (${file.Length} bytes)`);
      });
      
      // Clean up
      fs.unlinkSync(testFilePath);
      console.log(`🧹 Deleted local test file: ${testFilePath}`);
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      if (error instanceof StorageAuthenticationError) {
        console.log('\n🔑 Authentication Error Detected!');
        console.log('Common solutions:');
        console.log('1. Ensure your access key is correct and does not contain any spaces or special characters');
        console.log('2. Check that your storage zone name is spelled correctly');
        console.log('3. Try regenerating your storage zone password in the BunnyCDN dashboard');
        
        // Create a fix file
        const fixContent = `# BunnyCDN Authentication Fix

## Current Configuration
- Storage Zone: ${storageZone}
- Access Key: ${accessKey}
- Hostname: ${hostname}
- CDN URL: ${cdnUrl}

## Steps to Fix

1. Log into your BunnyCDN dashboard at https://panel.bunny.net/
2. Go to Edge Storage > Your Storage Zone > FTP & API Access
3. Click on "Reset Password" to generate a new access key
4. Copy the new access key and update your .env file:

\`\`\`
BUNNY_STORAGE_ACCESS_KEY=your_new_access_key_here
\`\`\`

5. Make sure the storage zone name is correct:

\`\`\`
BUNNY_STORAGE_ZONE_NAME=${storageZone}
\`\`\`

6. Run this test again to verify the fix
`;
        
        fs.writeFileSync('BUNNYCDN_AUTH_FIX.md', fixContent);
        console.log('\n✅ Created BUNNYCDN_AUTH_FIX.md with instructions');
      }
      
      // Clean up
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
        console.log(`🧹 Deleted local test file: ${testFilePath}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Install the SDK if not already installed
try {
  require('@bunny.net/storage-sdk');
  runTest();
} catch (error) {
  console.log('📦 Installing @bunny.net/storage-sdk...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install @bunny.net/storage-sdk', { stdio: 'inherit' });
    console.log('✅ Package installed successfully');
    runTest();
  } catch (installError) {
    console.error('❌ Failed to install package:', installError);
  }
}
