const axios = require('axios');

console.log('🔍 TESTING CLAUDE API DIRECTLY IN AZURE');

async function testClaudeAPI() {
  try {
    console.log('📋 Testing Claude API call directly...');
    
    // Test Claude API call directly to Azure endpoint
    const azureEndpoint = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb/generate-resume-complete';
    
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+919999999999',
      jobDescription: 'Simple test job for debugging AI processing.'
    };
    
    console.log('📤 Sending minimal test payload to see detailed logs...');
    console.log('🔍 This should trigger Claude API debugging output in Azure');
    
    const startTime = Date.now();
    const response = await axios.post(azureEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    const endTime = Date.now();
    
    console.log('✅ Response received in', (endTime - startTime) / 1000, 'seconds');
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.downloadUrl) {
      // Check file size
      const fileResponse = await axios.head(response.data.data.downloadUrl);
      const fileSize = parseInt(fileResponse.headers['content-length']);
      
      console.log('\n📄 File Analysis:');
      console.log('  File Size:', fileSize, 'bytes');
      console.log('  File Size (KB):', Math.round(fileSize / 1024), 'KB');
      
      if (fileSize < 5000) {
        console.log('❌ SMALL FILE SIZE - Confirms Claude AI is failing');
        console.log('🔍 Check Azure logs for detailed error messages');
      } else {
        console.log('✅ NORMAL FILE SIZE - Claude AI working properly');
      }
    }
    
    console.log('\n🔍 NEXT STEPS:');
    console.log('1. Check Azure App Service logs for Claude API debugging output');
    console.log('2. Look for "Claude AI Call Failed - DETAILED ERROR" messages');
    console.log('3. Verify Claude API key format and validity');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testClaudeAPI();
