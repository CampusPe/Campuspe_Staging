#!/usr/bin/env node

/**
 * Test script for WABB WhatsApp integration
 * This script tests the webhook endpoint that sends resume documents
 * 
 * Usage:
 * node test-wabb-integration.js
 */

const fetch = require('node-fetch');

async function testWABBIntegration() {
  console.log('🧪 Testing WABB WhatsApp Integration...\n');
  
  // Test configuration
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  const testData = {
    resumeId: 'test-resume-id-123', // Replace with actual resume ID
    number: '919156621088' // Replace with test phone number
  };
  
  console.log('📋 Test Configuration:');
  console.log(`• Base URL: ${baseUrl}`);
  console.log(`• Resume ID: ${testData.resumeId}`);
  console.log(`• Phone Number: ${testData.number}`);
  console.log('');
  
  try {
    // Test 1: WABB Document Send Endpoint
    console.log('🔄 Test 1: Testing WABB document send endpoint...');
    
    const response = await fetch(`${baseUrl}/api/generated-resume/wabb-send-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ WABB integration test passed!');
    } else {
      console.log('❌ WABB integration test failed!');
    }
    
    console.log('');
    
    // Test 2: Check WABB webhook URL
    console.log('🔄 Test 2: Testing WABB webhook availability...');
    
    try {
      const webhookResponse = await fetch('https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXygjq9/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: testData.number,
          document: 'https://example.com/test.pdf'
        })
      });
      
      console.log(`📊 Webhook Status: ${webhookResponse.status}`);
      
      if (webhookResponse.ok || webhookResponse.status === 200) {
        console.log('✅ WABB webhook is accessible!');
      } else {
        console.log('⚠️ WABB webhook returned non-200 status');
      }
      
    } catch (webhookError) {
      console.log('❌ WABB webhook test failed:', webhookError.message);
    }
    
    console.log('');
    
    // Test 3: Generate test resume (if API is running)
    console.log('🔄 Test 3: Testing resume generation...');
    
    try {
      const generateResponse = await fetch(`${baseUrl}/api/ai-resume/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TEST_TOKEN' // Replace with actual token
        },
        body: JSON.stringify({
          jobDescription: 'Software Engineer position requiring JavaScript, React, and Node.js experience'
        })
      });
      
      if (generateResponse.ok) {
        const generateResult = await generateResponse.json();
        console.log('✅ Resume generation endpoint working!');
        console.log(`📄 Generated Resume ID: ${generateResult.resumeId || 'N/A'}`);
      } else {
        console.log('⚠️ Resume generation requires authentication');
      }
      
    } catch (generateError) {
      console.log('❌ Resume generation test failed:', generateError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Replace test-resume-id-123 with an actual resume ID from your database');
  console.log('2. Replace phone number with your WhatsApp number for testing');
  console.log('3. Ensure your API server is running on the correct port');
  console.log('4. Check WABB webhook automation flow in your dashboard');
  console.log('5. Test with a real resume generation and WhatsApp share');
}

// Run the test
testWABBIntegration().catch(console.error);
