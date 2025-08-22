const axios = require('axios');

console.log('🎯 Testing WABB Webhook Triggering Directly');

// Test the exact webhook URL with proper payload
async function testWebhookTrigger() {
  try {
    const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
    
    const testPayload = {
      phone: '+919156621088',
      downloadUrl: 'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net/generated-resume/resume_1755842090528_y8xra5mqc',
      studentName: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      resumeId: 'test_webhook_trigger',
      timestamp: new Date().toISOString(),
      source: 'campuspe-webhook-test',
      action: 'resume-ready'
    };
    
    console.log('📤 Sending webhook request to:', webhookUrl);
    console.log('📤 Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(webhookUrl, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
      validateStatus: () => true // Accept all status codes
    });
    
    console.log('✅ Webhook Response Status:', response.status);
    console.log('✅ Webhook Response Headers:', response.headers);
    console.log('✅ Webhook Response Data:', response.data);
    
    if (response.status === 200 || response.status === 400) {
      console.log('🎉 Webhook appears to be working (status 200/400 are both acceptable for WABB)');
    } else {
      console.log('⚠️ Webhook may have issues - status:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Webhook test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

async function testResumeAccess() {
  try {
    console.log('\n🔍 Testing Resume Access...');
    const resumeUrl = 'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net/generated-resume/resume_1755842090528_y8xra5mqc';
    
    const response = await axios.get(resumeUrl, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('📄 Resume URL Status:', response.status);
    console.log('📄 Content-Type:', response.headers['content-type']);
    console.log('📄 Content-Length:', response.headers['content-length']);
    
    if (response.status === 200) {
      console.log('✅ Resume is accessible');
    } else {
      console.log('⚠️ Resume access issue - status:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Resume access test failed:', error.message);
  }
}

async function runTests() {
  await testWebhookTrigger();
  await testResumeAccess();
}

runTests();
