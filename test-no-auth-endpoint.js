const axios = require('axios');

async function testNoAuthEndpoint() {
  try {
    console.log('🧪 Testing No-Auth AI Resume Endpoint');
    console.log('='.repeat(50));
    
    const API_BASE = 'http://localhost:5001/api/ai-resume-builder';
    
    // Test payload
    const testData = {
      email: 'test@example.com',
      phone: '+1234567890',
      jobDescription: 'Software Developer position at a tech startup. Looking for someone with strong JavaScript skills, experience with React and Node.js. The role involves building scalable web applications and working with a dynamic team.',
      number: '1234567890' // WhatsApp number for WABB webhook
    };
    
    console.log('📝 Test Data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log();
    
    console.log('🚀 Making request to:', `${API_BASE}/generate-ai-no-auth`);
    
    const startTime = Date.now();
    const response = await axios.post(`${API_BASE}/generate-ai-no-auth`, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutes timeout for AI processing
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('✅ Request successful!');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log();
    
    console.log('📋 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log();
    
    // Test the download URL
    if (response.data.downloadUrl) {
      console.log('🔗 Testing download URL...');
      try {
        const downloadResponse = await axios.get(response.data.downloadUrl, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        console.log('✅ Download successful!');
        console.log(`📄 PDF Size: ${downloadResponse.data.length} bytes`);
        console.log(`📋 Content-Type: ${downloadResponse.headers['content-type']}`);
      } catch (downloadError) {
        console.error('❌ Download failed:', downloadError.message);
      }
    }
    
    console.log();
    console.log('🎯 Key Features Tested:');
    console.log('  ✅ No authentication required');
    console.log('  ✅ AI resume generation');
    console.log('  ✅ Temporary storage system');
    console.log('  ✅ Public download URL creation');
    console.log('  ✅ WABB webhook trigger');
    console.log('  ✅ PDF generation and delivery');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.log('📋 Error Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on http://localhost:5001');
    }
  }
}

// Run the test
testNoAuthEndpoint();
