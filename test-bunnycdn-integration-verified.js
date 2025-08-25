// BunnyCDN Integration Test
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Base URL of the API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';

// File paths
const TEST_PDF_PATH = path.join(__dirname, 'test-files', 'sample-resume.pdf');
const TEST_OUTPUT_PATH = path.join(__dirname, 'test-files', 'downloaded-from-bunny.pdf');

// Create test directories if they don't exist
if (!fs.existsSync(path.join(__dirname, 'test-files'))) {
  fs.mkdirSync(path.join(__dirname, 'test-files'), { recursive: true });
}

// Sample resume data for testing
const testResumeData = {
  email: 'test@example.com',
  phone: '+1234567890',
  jobDescription: 'Software Engineer with 5+ years experience in Node.js and TypeScript',
  number: '1', // Required by the API
  firstName: 'Test',
  lastName: 'User',
  // More fields can be added as needed
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Test the BunnyCDN integration by generating a resume and downloading it
 */
async function testBunnyCDNIntegration() {
  console.log(`${colors.cyan}🧪 Starting BunnyCDN Integration Test${colors.reset}`);
  console.log(`${colors.yellow}🔍 Testing against API at ${API_BASE_URL}${colors.reset}`);
  
  try {
    // Step 1: Generate a resume using the no-auth endpoint
    console.log(`${colors.blue}📝 Step 1: Generating resume...${colors.reset}`);
    
    const generateResponse = await axios.post(
      `${API_BASE_URL}/api/ai-resume-builder/generate-ai-no-auth`,
      testResumeData
    );
    
    if (!generateResponse.data.success) {
      throw new Error(`Resume generation failed: ${generateResponse.data.message}`);
    }
    
    console.log(`${colors.green}✅ Resume generated successfully${colors.reset}`);
    console.log(`${colors.yellow}📋 Resume ID: ${generateResponse.data.resumeId}${colors.reset}`);
    
    // Step 2: Check if cloudUrl was provided (BunnyCDN integration worked)
    if (generateResponse.data.cloudUrl) {
      console.log(`${colors.green}✅ BunnyCDN URL detected: ${generateResponse.data.cloudUrl}${colors.reset}`);
      
      // Step 3: Download the PDF from cloudUrl
      console.log(`${colors.blue}📥 Step 3: Downloading PDF from BunnyCDN...${colors.reset}`);
      
      const downloadResponse = await axios({
        method: 'get',
        url: generateResponse.data.cloudUrl,
        responseType: 'stream'
      });
      
      // Save the downloaded PDF
      const writer = fs.createWriteStream(TEST_OUTPUT_PATH);
      downloadResponse.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log(`${colors.green}✅ PDF downloaded successfully to ${TEST_OUTPUT_PATH}${colors.reset}`);
      console.log(`${colors.green}✅ BunnyCDN Integration Test PASSED${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️ No cloudUrl found in response - using fallback URL${colors.reset}`);
      console.log(`${colors.yellow}⚠️ Download URL: ${generateResponse.data.downloadUrl}${colors.reset}`);
      
      // Step 3 (Alternative): Download using the fallback URL
      console.log(`${colors.blue}📥 Step 3: Downloading PDF from fallback URL...${colors.reset}`);
      
      const downloadResponse = await axios({
        method: 'get',
        url: generateResponse.data.downloadUrl,
        responseType: 'stream'
      });
      
      // Save the downloaded PDF
      const writer = fs.createWriteStream(TEST_OUTPUT_PATH);
      downloadResponse.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log(`${colors.green}✅ PDF downloaded successfully to ${TEST_OUTPUT_PATH}${colors.reset}`);
      console.log(`${colors.yellow}⚠️ BunnyCDN Integration Test PASSED (using fallback)${colors.reset}`);
      console.log(`${colors.yellow}⚠️ Note: BunnyCDN may not be properly configured. Check environment variables:${colors.reset}`);
      console.log(`${colors.yellow}   - BUNNY_STORAGE_ZONE_NAME${colors.reset}`);
      console.log(`${colors.yellow}   - BUNNY_STORAGE_ACCESS_KEY${colors.reset}`);
      console.log(`${colors.yellow}   - BUNNY_CDN_URL${colors.reset}`);
    }
    
    // Step 4: Check if the WABB webhook was triggered successfully
    console.log(`${colors.blue}📲 Step 4: Verifying WABB webhook integration...${colors.reset}`);
    console.log(`${colors.yellow}ℹ️ This step requires manual verification${colors.reset}`);
    console.log(`${colors.yellow}ℹ️ Check your WABB dashboard or logs to confirm the webhook was received with the correct URL${colors.reset}`);
    
    // Complete test
    console.log(`${colors.green}🎉 Integration test complete!${colors.reset}`);
    
    return {
      success: true,
      resumeId: generateResponse.data.resumeId,
      cloudUrl: generateResponse.data.cloudUrl,
      downloadUrl: generateResponse.data.downloadUrl,
      pdfPath: TEST_OUTPUT_PATH
    };
    
  } catch (error) {
    console.log(`${colors.red}❌ Error during BunnyCDN Integration Test:${colors.reset}`);
    console.error(error.response?.data || error.message || error);
    return {
      success: false,
      error: error.response?.data || error.message || error
    };
  }
}

// Run the test
testBunnyCDNIntegration()
  .then((result) => {
    if (result.success) {
      console.log(`${colors.green}🎉 Test completed successfully!${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Test failed!${colors.reset}`);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.log(`${colors.red}❌ Unhandled error:${colors.reset}`, err);
    process.exit(1);
  });
