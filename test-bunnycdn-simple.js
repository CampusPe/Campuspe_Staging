// BunnyCDN Integration Test (Simplified)
const axios = require('axios');

// Base URL of the API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';

// Sample resume data for testing
const testResumeData = {
  email: 'test@example.com',
  phone: '+1234567890',
  jobDescription: 'Software Engineer with 5+ years experience in Node.js and TypeScript',
  number: '1', // Required by the API
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

/**
 * Test the resume generation endpoint with BunnyCDN integration
 */
async function testResumeGeneration() {
  console.log(`${colors.blue}🧪 Testing Resume Generation API${colors.reset}`);
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/ai-resume-builder/generate-ai-no-auth`,
      testResumeData
    );
    
    console.log(`${colors.green}✅ API Response:${colors.reset}`, JSON.stringify(response.data, null, 2));
    
    if (response.data.cloudUrl) {
      console.log(`${colors.green}✅ BunnyCDN Integration Success: ${response.data.cloudUrl}${colors.reset}`);
    } else if (response.data.downloadUrl) {
      console.log(`${colors.yellow}⚠️ Using Fallback URL: ${response.data.downloadUrl}${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ No URL found in response${colors.reset}`);
    }
    
    return response.data;
  } catch (error) {
    console.log(`${colors.red}❌ API Error:${colors.reset}`);
    console.error(error.response?.data || error.message);
    throw error;
  }
}

// Run the test
testResumeGeneration()
  .then(result => {
    console.log(`${colors.green}🎉 Test completed!${colors.reset}`);
  })
  .catch(error => {
    console.log(`${colors.red}❌ Test failed!${colors.reset}`);
    process.exit(1);
  });
