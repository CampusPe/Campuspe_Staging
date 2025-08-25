/**
 * This is a simplified test script using the BunnyCDN official SDK
 * with correct imports and error handling.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { exec } = require('child_process');

// Load environment variables
const envPath = path.resolve(process.cwd(), 'apps/api/.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// BunnyCDN credentials
const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
const cdnUrl = process.env.BUNNY_CDN_URL;

console.log('🧪 BunnyCDN SDK Test');
console.log('------------------');
console.log(`Storage Zone: ${storageZone}`);
console.log(`Access Key: ${accessKey ? accessKey.substring(0, 8) + '...' : 'Not set'}`);
console.log(`CDN URL: ${cdnUrl}`);
console.log('------------------');

// Create a test file
const testFileName = `test-${Date.now()}.txt`;
const testContent = `This is a test file created at ${new Date().toISOString()}`;

fs.writeFileSync(testFileName, testContent);
console.log(`✅ Created test file: ${testFileName}`);

// Run a simple script with the SDK
const scriptContent = `
const { Storage } = require('@bunny.net/storage-sdk');

async function testBunny() {
  try {
    const storage = new Storage("${accessKey}", "${storageZone}");
    
    console.log('✅ Storage client initialized');
    
    // Upload the test file
    const remotePath = "/test/${testFileName}";
    console.log(\`🔄 Uploading to \${remotePath}...\`);
    
    await storage.upload("./${testFileName}", remotePath);
    console.log('✅ Upload successful!');
    
    // List files
    console.log('🔄 Listing files in /test directory...');
    const files = await storage.list('/test');
    console.log(\`Found \${files.length} files:\`);
    files.forEach(file => {
      console.log(\`- \${file.ObjectName} (\${file.Length} bytes)\`);
    });
    
    const downloadUrl = \`${cdnUrl}\${remotePath}\`;
    console.log(\`🔍 Download URL: \${downloadUrl}\`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.log(\`Status: \${error.response.status}\`);
      console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
    }
  }
}

testBunny();
`;

// Write the test script to a temporary file
const tempScriptFile = 'temp-bunny-test.js';
fs.writeFileSync(tempScriptFile, scriptContent);

// Run the script
console.log('🔄 Running test script...');
exec(`node ${tempScriptFile}`, (error, stdout, stderr) => {
  console.log(stdout);
  
  if (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(stderr);
    
    // Create a fix file with instructions
    const fixContent = `# BunnyCDN Authentication Fix

## Current Configuration
- Storage Zone: ${storageZone}
- Access Key: ${accessKey}
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
    console.log('✅ Created BUNNYCDN_AUTH_FIX.md with instructions');
  }
  
  // Clean up
  try {
    fs.unlinkSync(testFileName);
    fs.unlinkSync(tempScriptFile);
    console.log(`🧹 Deleted temporary files`);
  } catch (e) {
    console.error(`❌ Error deleting temporary files: ${e.message}`);
  }
});
