const axios = require('axios');

async function testWhatsAppWithDebugEndpoint() {
  try {
    console.log('🧪 Testing WhatsApp debug generate-and-share endpoint...');
    
    // Test data for WhatsApp integration
    const testData = {
      name: "Test User",
      email: "test@campuspe.com", // This will trigger the "user not found" flow
      phone: "919156621088", // Your WhatsApp number for testing
      jobDescription: "We are looking for a Software Developer with experience in React, Node.js, and MongoDB. The ideal candidate should have 2+ years of experience in web development and be proficient in JavaScript/TypeScript. Knowledge of cloud platforms like Azure is a plus."
    };

    // Test with debug endpoint that has more detailed logging
    const localUrl = 'http://localhost:5001/api/wabb/debug-generate-and-share';
    
    console.log('Testing debug request payload:', testData);
    console.log('Request URL:', localUrl);
    
    const response = await axios.post(localUrl, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for AI generation
    });

    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing debug WhatsApp endpoint:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // The user not found case is expected - let's check what webhook should be triggered
      if (error.response.data.message?.includes('Student profile not found')) {
        console.log('💡 This triggers the "User not found" webhook to WABB');
        console.log('🔗 WABB should receive a webhook to handle user registration');
      }
    }
  }
}

testWhatsAppWithDebugEndpoint();
