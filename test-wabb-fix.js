#!/usr/bin/env node

/**
 * Quick test script to verify WABB integration fix
 * Run this after starting your API server
 */

const axios = require('axios');

async function testWABBFix() {
  console.log('🧪 Testing WABB Integration Fix...\n');
  
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  const testData = {
    resumeId: 'test-resume-123', // Replace with actual resume ID
    number: '919156621088'       // Replace with your test phone number
  };
  
  console.log('📋 Test Configuration:');
  console.log(`• API URL: ${baseUrl}`);
  console.log(`• Resume ID: ${testData.resumeId}`);
  console.log(`• Phone Number: ${testData.number}\n`);
  
  try {
    console.log('🔄 Testing WABB endpoint...');
    
    const response = await axios.post(`${baseUrl}/api/generated-resume/wabb-send-document`, testData, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('\n🎉 WABB integration fix successful!');
      console.log('✅ No more 500 errors');
      console.log('✅ Axios is working correctly');
      console.log('✅ Webhook call should be sent to WABB');
    } else {
      console.log('\n⚠️ Unexpected response - check your resume ID');
    }
    
  } catch (error) {
    console.log(`❌ Error Status: ${error.response?.status || 'No response'}`);
    console.log(`❌ Error Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.status === 404) {
      console.log('\n💡 This is expected if you used a test resume ID');
      console.log('💡 Generate a real resume first, then use its ID');
    } else if (error.response?.status === 500) {
      console.log('\n❌ Still getting 500 errors - check server logs');
      console.log('❌ Make sure GeneratedResume model is properly imported');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n❌ API server is not running');
      console.log('❌ Start your server with: npm run dev');
    }
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. If you got 404: Generate a real resume and use its ID');
  console.log('2. If successful: Test with your WhatsApp number');
  console.log('3. Check WABB dashboard for webhook execution');
  console.log('4. Verify resume document arrives on WhatsApp');
}

testWABBFix().catch(console.error);
