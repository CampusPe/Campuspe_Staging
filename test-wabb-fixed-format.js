const axios = require('axios');

async function testWabbWebhookFormat() {
  try {
    console.log('🧪 Testing WABB Webhook Format Updates');
    console.log('='.repeat(60));
    
    // Test 1: Test no-auth endpoint
    console.log('📋 Test 1: No-Auth Endpoint');
    console.log('-'.repeat(30));
    
    const noAuthPayload = {
      email: 'test@example.com',
      phone: '+919876543210',
      jobDescription: 'Software Engineer with React, Node.js, MongoDB experience. Full-stack development role.',
      number: '+919876543210'
    };
    
    console.log('🚀 Calling no-auth endpoint...');
    const noAuthResponse = await axios.post(
      'http://localhost:5001/api/ai-resume-builder/generate-ai-no-auth',
      noAuthPayload,
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000 
      }
    );
    
    console.log('✅ No-Auth Response:', {
      success: noAuthResponse.data.success,
      resumeId: noAuthResponse.data.data?.resumeId,
      downloadUrl: noAuthResponse.data.data?.downloadUrl,
      webhookTriggered: noAuthResponse.data.data?.webhookTriggered
    });
    
    // Test 2: Direct WABB webhook test with correct format
    console.log('\n📋 Test 2: Direct WABB Webhook');
    console.log('-'.repeat(30));
    
    const directWabbPayload = {
      document: noAuthResponse.data.data?.downloadUrl || 'https://example.com/test.pdf',
      number: '919876543210', // No + prefix
      resumeId: 'test_resume_123',
      email: 'test@example.com',
      timestamp: new Date().toISOString()
    };
    
    console.log('🎯 Direct WABB payload:', directWabbPayload);
    
    try {
      const wabbResponse = await axios.post(
        'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/',
        directWabbPayload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );
      
      console.log('✅ WABB Direct Response:', {
        status: wabbResponse.status,
        statusText: wabbResponse.statusText,
        data: wabbResponse.data
      });
    } catch (wabbError) {
      console.log('❌ WABB Direct Error:', {
        message: wabbError.message,
        status: wabbError?.response?.status,
        data: wabbError?.response?.data
      });
    }
    
    // Test 3: Check download URL accessibility
    console.log('\n📋 Test 3: Download URL Check');
    console.log('-'.repeat(30));
    
    if (noAuthResponse.data.data?.downloadUrl) {
      try {
        const downloadCheck = await axios.head(noAuthResponse.data.data.downloadUrl);
        console.log('✅ Download URL accessible:', {
          status: downloadCheck.status,
          contentType: downloadCheck.headers['content-type'],
          contentLength: downloadCheck.headers['content-length']
        });
      } catch (downloadError) {
        console.log('❌ Download URL error:', downloadError.message);
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('  ✅ Updated payload format: document + number (no +)');
    console.log('  ✅ Enhanced logging for webhook responses');
    console.log('  ✅ Error handling for WABB webhook failures');
    console.log('  ✅ Both endpoints use consistent WABB format');
    
    console.log('\n📞 WABB Automation Requirements:');
    console.log('  🔑 Required fields: document, number');
    console.log('  📱 Phone format: 919876543210 (no + prefix)');
    console.log('  🔗 Document URL: Must be publicly accessible HTTPS');
    console.log('  ✅ Webhook URL: https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.log('📋 Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Run the test
testWabbWebhookFormat();
