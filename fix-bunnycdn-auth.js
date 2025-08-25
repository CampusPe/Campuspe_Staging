/**
 * This script creates a Node.js implementation to debug and fix
 * the BunnyCDN authentication issue.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
let envPath = path.resolve(process.cwd(), 'apps/api/.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '.env');
}

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: Cannot find .env file');
  process.exit(1);
}

dotenv.config({ path: envPath });

console.log('🧪 BunnyCDN Authentication Test');
console.log('------------------------------');

// BunnyCDN credentials from env
const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
const hostname = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';
const cdnUrl = process.env.BUNNY_CDN_URL;

console.log(`Storage Zone: ${storageZone}`);
console.log(`Access Key: ${accessKey ? accessKey.substring(0, 8) + '...' : 'Not set'}`);
console.log(`Hostname: ${hostname}`);
console.log(`CDN URL: ${cdnUrl}`);
console.log('------------------------------');

// Check if access key follows standard format
let formatTips = '';
if (!accessKey) {
  formatTips = '❌ Access key is missing';
} else if (accessKey.includes('-')) {
  // BunnyCDN access keys shouldn't have hyphens; they're typically pure alphanumeric
  formatTips = '⚠️ Access key contains hyphens. BunnyCDN access keys are typically alphanumeric without hyphens.';
} else if (accessKey.length !== 36 && accessKey.length !== 64) {
  // BunnyCDN access keys are typically 36 or 64 characters
  formatTips = `⚠️ Access key length is ${accessKey.length}. BunnyCDN access keys are typically 36 or 64 characters.`;
}

if (formatTips) {
  console.log(formatTips);
  console.log('------------------------------');
}

// Create test file
const testFileName = `test_${Date.now()}.txt`;
const testContent = `This is a test file uploaded at ${new Date().toISOString()}`;
fs.writeFileSync(testFileName, testContent);
console.log(`✅ Created test file: ${testFileName}`);

// Upload path
const uploadPath = `test/${testFileName}`;

// Function to test upload with various AccessKey formats
async function testUpload(headerFormat, accessKeyToUse = accessKey) {
  const url = `https://${hostname}/${storageZone}/${uploadPath}`;
  
  console.log(`\n🔄 Testing format: ${headerFormat}`);
  console.log(`URL: ${url}`);
  
  const headers = {};
  
  // Set the header according to format
  switch (headerFormat) {
    case 'AccessKey':
      headers['AccessKey'] = accessKeyToUse;
      break;
    case 'Authorization':
      headers['Authorization'] = `Bearer ${accessKeyToUse}`;
      break;
    case 'Authorization Basic':
      headers['Authorization'] = `Basic ${Buffer.from(accessKeyToUse).toString('base64')}`;
      break;
    default:
      headers['AccessKey'] = accessKeyToUse;
  }
  
  try {
    const response = await axios({
      method: 'PUT',
      url: url,
      data: fs.createReadStream(testFileName),
      headers: headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    
    // Test download
    const cdnDownloadUrl = `${cdnUrl}/${uploadPath}`;
    console.log(`\n🔄 Testing download from: ${cdnDownloadUrl}`);
    
    try {
      const downloadResponse = await axios.head(cdnDownloadUrl);
      console.log(`✅ Download successful! Status: ${downloadResponse.status}`);
      return true;
    } catch (dlErr) {
      console.log(`❌ Download failed: ${dlErr.message}`);
      if (dlErr.response) {
        console.log(`Status: ${dlErr.response.status}`);
        console.log('Headers:', JSON.stringify(dlErr.response.headers, null, 2));
      }
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Upload failed: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
    }
    return false;
  }
}

// Remove hyphens from the access key to test if that's the issue
const cleanedAccessKey = accessKey ? accessKey.replace(/-/g, '') : '';

// Run tests with different formats
async function runTests() {
  console.log('\n🧪 Running BunnyCDN Authentication Tests:');
  
  // Test with original access key
  console.log('\n📋 TEST GROUP 1: Original Access Key');
  let success = await testUpload('AccessKey'); // Standard format
  if (!success) {
    await testUpload('Authorization'); // Try as Bearer token
    await testUpload('Authorization Basic'); // Try as Basic auth
  }
  
  // If original failed and we have hyphens, try without hyphens
  if (!success && accessKey && accessKey !== cleanedAccessKey) {
    console.log('\n📋 TEST GROUP 2: Access Key without hyphens');
    success = await testUpload('AccessKey', cleanedAccessKey);
    if (!success) {
      await testUpload('Authorization', cleanedAccessKey);
    }
  }
  
  // Output recommendation based on tests
  if (!success) {
    console.log('\n❌ All tests failed. Please check your BunnyCDN account for the correct access key format.');
    console.log('Common issues:');
    console.log('1. The access key might be incorrect');
    console.log('2. The storage zone name might be wrong');
    console.log('3. The access key might need to be in a different format');
    
    if (accessKey && accessKey.includes('-')) {
      console.log('\n⚠️ Your access key contains hyphens. Try removing them:');
      console.log(`Original: ${accessKey}`);
      console.log(`Without hyphens: ${cleanedAccessKey}`);
      
      // Create or update a file with the suggested fixes
      const fixContent = `# BunnyCDN Configuration Fix

## Current Configuration
- BUNNY_STORAGE_ZONE_NAME=${storageZone}
- BUNNY_STORAGE_ACCESS_KEY=${accessKey}
- BUNNY_STORAGE_HOSTNAME=${hostname}
- BUNNY_CDN_URL=${cdnUrl}

## Suggested Fix
Update your .env file with this corrected access key:

\`\`\`
BUNNY_STORAGE_ACCESS_KEY=${cleanedAccessKey}
\`\`\`

The access key should not contain any hyphens. If this doesn't work, please log into your BunnyCDN account and check the correct access key for your storage zone.
`;
      
      fs.writeFileSync('BUNNYCDN_FIX.md', fixContent);
      console.log('\n✅ Created BUNNYCDN_FIX.md with suggested fixes');
    }
  } else {
    console.log('\n✅ Test passed! Your BunnyCDN configuration is working.');
  }
  
  // Clean up
  try {
    fs.unlinkSync(testFileName);
    console.log(`\n🧹 Deleted test file: ${testFileName}`);
  } catch (e) {
    console.error(`\n❌ Error deleting test file: ${e.message}`);
  }
}

runTests();
