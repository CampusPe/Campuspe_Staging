const axios = require('axios');

async function testWhatsAppGenerateAndShare() {
  try {
    console.log('🧪 Testing WhatsApp generate-and-share endpoint...');
    
    // Test data for WhatsApp integration
    const testData = {
      name: "Test User",
      email: "test@campuspe.com", // Use an email that exists in your test database
      phone: "919156621088", // Your WhatsApp number for testing
      jobDescription: "We are looking for a Software Developer with experience in React, Node.js, and MongoDB. The ideal candidate should have 2+ years of experience in web development and be proficient in JavaScript/TypeScript. Knowledge of cloud platforms like Azure is a plus."
    };

    // Test with localhost first (if API is running locally)
    const localUrl = 'http://localhost:5001/api/wabb/generate-and-share';
    
    console.log('Testing request payload:', testData);
    console.log('Request URL:', localUrl);
    
    const response = await axios.post(localUrl, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for AI generation
    });

    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('🎉 WhatsApp generate-and-share working correctly!');
      console.log('📱 Resume should be sent to WhatsApp number:', testData.phone);
    } else {
      console.log('❌ Request failed:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing WhatsApp generate-and-share:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Make sure the API server is running locally with "npm run dev"');
    }
  }
}

testWhatsAppGenerateAndShare();
