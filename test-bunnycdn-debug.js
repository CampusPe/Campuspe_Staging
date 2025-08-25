// Improved BunnyCDN Test Script with Debugging
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/api/.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// BunnyCDN configuration from environment
console.log(`${colors.blue}🔍 Loading BunnyCDN configuration...${colors.reset}`);

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_NAME;
// Remove any whitespace, newlines, or other invisible characters from the key
let BUNNY_ACCESS_KEY = process.env.BUNNY_STORAGE_ACCESS_KEY?.trim();
// Remove any quotes that might have been accidentally included
BUNNY_ACCESS_KEY = BUNNY_ACCESS_KEY?.replace(/["']/g, '');
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL?.trim();
const BUNNY_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME?.trim() || 'storage.bunnycdn.com';

// Show configuration
console.log(`${colors.blue}📋 Configuration:${colors.reset}`);
console.log(`  Storage Zone: ${BUNNY_STORAGE_ZONE || colors.red + 'Not set' + colors.reset}`);
console.log(`  Access Key: ${BUNNY_ACCESS_KEY ? '********' : colors.red + 'Not set' + colors.reset}`);
console.log(`  CDN URL: ${BUNNY_CDN_URL || colors.red + 'Not set' + colors.reset}`);
console.log(`  Hostname: ${BUNNY_HOSTNAME || colors.red + 'Not set' + colors.reset}`);

// Display raw values for debugging (hide full key)
if (BUNNY_ACCESS_KEY) {
  const keyFirstChars = BUNNY_ACCESS_KEY.substring(0, 8);
  const keyLastChars = BUNNY_ACCESS_KEY.substring(BUNNY_ACCESS_KEY.length - 4);
  console.log(`${colors.yellow}⚠️ Key format check: ${keyFirstChars}...${keyLastChars} (${BUNNY_ACCESS_KEY.length} characters)${colors.reset}`);
  
  // Check for special characters that might need escaping
  if (BUNNY_ACCESS_KEY.includes('-')) {
    console.log(`${colors.yellow}⚠️ Note: Key contains hyphens${colors.reset}`);
  }
}

// Create test PDF buffer
const createTestPDF = () => {
  console.log(`${colors.blue}📄 Creating test PDF...${colors.reset}`);
  return Buffer.from('%PDF-1.5\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer\n<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n');
};

// Upload to BunnyCDN with debugging
const uploadToBunnyCDN = async (pdfBuffer) => {
  if (!BUNNY_STORAGE_ZONE || !BUNNY_ACCESS_KEY || !BUNNY_CDN_URL) {
    console.log(`${colors.red}❌ Missing BunnyCDN configuration${colors.reset}`);
    return { success: false, error: 'Missing BunnyCDN configuration' };
  }
  
  const uniqueId = Date.now().toString();
  const fileName = `test_${uniqueId}.pdf`;
  const storagePath = `test/${fileName}`;
  const uploadUrl = `https://${BUNNY_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${storagePath}`;
  
  console.log(`${colors.blue}📤 Uploading to BunnyCDN...${colors.reset}`);
  console.log(`  URL: ${uploadUrl}`);
  console.log(`  Content-Length: ${pdfBuffer.length}`);
  
  const headers = {
    'AccessKey': BUNNY_ACCESS_KEY,
    'Content-Type': 'application/pdf',
    'Content-Length': pdfBuffer.length.toString()
  };
  
  console.log(`${colors.blue}🔑 Request headers:${colors.reset}`);
  console.log('  AccessKey: ********');
  console.log(`  Content-Type: ${headers['Content-Type']}`);
  console.log(`  Content-Length: ${headers['Content-Length']}`);
  
  try {
    console.log(`${colors.blue}⏳ Sending request...${colors.reset}`);
    
    const response = await axios({
      method: 'put',
      url: uploadUrl,
      data: pdfBuffer,
      headers: headers,
      timeout: 10000,
      validateStatus: () => true // Accept any status to see error responses
    });
    
    console.log(`${colors.blue}📨 Response received: ${response.status} ${response.statusText}${colors.reset}`);
    console.log('  Headers:', JSON.stringify(response.headers, null, 2));
    
    if (response.data) {
      console.log('  Data:', typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data.toString().substring(0, 100));
    }
    
    if (response.status === 201) {
      const cdnUrl = `${BUNNY_CDN_URL}/${storagePath}`;
      console.log(`${colors.green}✅ Upload successful!${colors.reset}`);
      console.log(`  CDN URL: ${cdnUrl}`);
      return { success: true, url: cdnUrl };
    } else {
      console.log(`${colors.red}❌ Upload failed with status: ${response.status}${colors.reset}`);
      return { 
        success: false, 
        error: `Status ${response.status}: ${JSON.stringify(response.data) || 'Unknown error'}` 
      };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Upload error:${colors.reset}`);
    
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log('  Response:', error.response.data);
    } else if (error.request) {
      console.log('  No response received');
      console.log('  Request:', error.request);
    } else {
      console.log(`  Error message: ${error.message}`);
    }
    
    return { success: false, error: error.message };
  }
};

// Run the test
const runTest = async () => {
  console.log(`${colors.blue}🧪 Starting BunnyCDN test...${colors.reset}`);
  
  try {
    // Generate PDF
    const pdfBuffer = createTestPDF();
    
    // Upload to BunnyCDN
    const result = await uploadToBunnyCDN(pdfBuffer);
    
    if (result.success) {
      console.log(`${colors.green}🎉 Test successful!${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Test failed: ${result.error}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`);
    return false;
  }
};

runTest()
  .then(success => {
    if (success) {
      console.log(`${colors.green}✅ BunnyCDN integration is working correctly!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ BunnyCDN integration verification failed.${colors.reset}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`${colors.red}❌ Error running test:${colors.reset}`, error);
    process.exit(1);
  });
