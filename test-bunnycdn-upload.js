// Test BunnyCDN Upload Functionality
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Get environment variables
require('dotenv').config({ path: path.join(__dirname, 'apps/api/.env') });

const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
const cdnUrl = process.env.BUNNY_CDN_URL;
const hostname = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';

console.log(`${colors.cyan}🧪 BunnyCDN Upload Test${colors.reset}`);
console.log(`${colors.blue}Configuration:${colors.reset}`);
console.log(`  Storage Zone: ${storageZone ? colors.green + storageZone + colors.reset : colors.red + 'Not set' + colors.reset}`);
console.log(`  CDN URL: ${cdnUrl ? colors.green + cdnUrl + colors.reset : colors.red + 'Not set' + colors.reset}`);
console.log(`  API Host: ${hostname ? colors.green + hostname + colors.reset : colors.red + 'Not set' + colors.reset}`);
console.log(`  Access Key: ${accessKey ? colors.green + '********' + colors.reset : colors.red + 'Not set' + colors.reset}`);

// Check if config is complete
if (!storageZone || !accessKey || !cdnUrl) {
  console.log(`${colors.red}❌ BunnyCDN configuration incomplete. Please run configure-bunnycdn.sh first.${colors.reset}`);
  process.exit(1);
}

// Create a test PDF buffer
const createTestPDF = () => {
  console.log(`${colors.blue}📄 Creating test PDF data...${colors.reset}`);
  return Buffer.from('%PDF-1.5\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer\n<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n');
};

// Upload to BunnyCDN
const uploadToBunnyCDN = async (pdfBuffer) => {
  const resumeId = `test_${Date.now()}`;
  const fileName = `TestResume_${resumeId}.pdf`;
  const uploadPath = `resumes/${resumeId}/${fileName}`;
  const uploadUrl = `https://${hostname}/${storageZone}/${uploadPath}`;
  
  console.log(`${colors.blue}📤 Uploading to BunnyCDN...${colors.reset}`);
  console.log(`  Path: ${uploadPath}`);
  
  try {
    const response = await axios.put(uploadUrl, pdfBuffer, {
      headers: {
        'AccessKey': accessKey,
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString()
      }
    });
    
    if (response.status === 201) {
      const cdnFileUrl = `${cdnUrl}/${uploadPath}`;
      console.log(`${colors.green}✅ Upload successful!${colors.reset}`);
      console.log(`  CDN URL: ${cdnFileUrl}`);
      return { success: true, url: cdnFileUrl };
    } else {
      console.log(`${colors.red}❌ Upload failed with status: ${response.status}${colors.reset}`);
      return { success: false, error: `Unexpected status: ${response.status}` };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Upload error:${colors.reset}`);
    console.error(error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Test downloading the file
const testDownload = async (url) => {
  console.log(`${colors.blue}📥 Testing download from CDN...${colors.reset}`);
  console.log(`  URL: ${url}`);
  
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    if (response.status === 200) {
      console.log(`${colors.green}✅ Download successful!${colors.reset}`);
      console.log(`  Content-Type: ${response.headers['content-type']}`);
      console.log(`  Content-Length: ${response.data.length} bytes`);
      return { success: true };
    } else {
      console.log(`${colors.red}❌ Download failed with status: ${response.status}${colors.reset}`);
      return { success: false, error: `Unexpected status: ${response.status}` };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Download error:${colors.reset}`);
    console.error(error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Run the test
const runTest = async () => {
  try {
    // Create test PDF
    const pdfBuffer = createTestPDF();
    
    // Upload to BunnyCDN
    const uploadResult = await uploadToBunnyCDN(pdfBuffer);
    
    if (uploadResult.success) {
      // Test downloading
      const downloadResult = await testDownload(uploadResult.url);
      
      if (downloadResult.success) {
        console.log(`${colors.green}🎉 All tests passed! BunnyCDN integration is working correctly.${colors.reset}`);
        return true;
      }
    }
    
    console.log(`${colors.red}❌ Tests failed. Please check the logs above for details.${colors.reset}`);
    return false;
  } catch (error) {
    console.log(`${colors.red}❌ Unexpected error:${colors.reset}`, error);
    return false;
  }
};

runTest()
  .then(success => {
    if (success) {
      console.log(`${colors.green}✅ BunnyCDN integration verified successfully!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ BunnyCDN integration verification failed.${colors.reset}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`${colors.red}❌ Test execution error:${colors.reset}`, error);
    process.exit(1);
  });
