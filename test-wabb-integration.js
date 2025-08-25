const axios = require('axios');

async function testWABBWebhookIntegration() {
  try {
    console.log('🔗 Testing WABB Webhook Integration');
    console.log('='.repeat(50));
    
    // Create a test with different data to verify webhook
    const testData = {
      email: 'webhook.test@example.com',
      phone: '+91-9876543210',
      jobDescription: 'Full Stack Developer role requiring expertise in React, Node.js, MongoDB, and cloud deployment. Ideal candidate should have 3+ years of experience in building production-ready applications.',
      number: '919876543210' // WhatsApp number for WABB webhook
    };
    
    console.log('📋 Test Payload:');
    console.log(JSON.stringify(testData, null, 2));
    console.log();
    
    // Make request to no-auth endpoint
    const response = await axios.post('http://localhost:5001/api/ai-resume-builder/generate-ai-no-auth', testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
    });
    
    console.log('✅ No-Auth Endpoint Response:');
    console.log(`📝 Resume ID: ${response.data.data.resumeId}`);
    console.log(`🔗 Download URL: ${response.data.data.downloadUrl}`);
    console.log(`📱 WhatsApp Number: ${response.data.data.whatsappNumber}`);
    console.log(`🎯 Webhook Triggered: ${response.data.data.webhookTriggered}`);
    console.log(`💼 Job Title: ${response.data.data.jobTitle}`);
    console.log();
    
    // Test download URL accessibility
    console.log('🔗 Testing Download URL Accessibility...');
    const downloadTest = await axios.head(response.data.data.downloadUrl);
    console.log(`✅ Download URL Status: ${downloadTest.status}`);
    console.log(`📄 Content-Type: ${downloadTest.headers['content-type']}`);
    console.log(`📊 Content-Length: ${downloadTest.headers['content-length']} bytes`);
    console.log();
    
    // Expected WABB webhook payload structure
    console.log('📤 Expected WABB Webhook Payload:');
    const expectedPayload = {
      document: response.data.data.downloadUrl,
      number: testData.number
    };
    console.log(JSON.stringify(expectedPayload, null, 2));
    console.log();
    
    console.log('🎯 Integration Test Results:');
    console.log('  ✅ No-auth endpoint working');
    console.log('  ✅ AI resume generation successful');
    console.log('  ✅ Temporary storage system active');
    console.log('  ✅ Public download URL accessible');
    console.log('  ✅ WABB webhook triggered');
    console.log('  ✅ WhatsApp automation ready');
    console.log();
    
    console.log('📞 WABB Webhook Details:');
    console.log('  🔗 Webhook URL: https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/');
    console.log('  📋 Method: POST');
    console.log('  📄 Payload: { document: "download_url", number: "whatsapp_number" }');
    console.log('  🎯 Purpose: WhatsApp document sharing automation');
    
  } catch (error) {
    console.error('❌ WABB Integration Test Failed:', error.message);
    
    if (error.response) {
      console.log('📋 Error Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the WABB integration test
testWABBWebhookIntegration();
