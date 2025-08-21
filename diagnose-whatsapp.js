const axios = require('axios');

async function diagnoseWhatsAppIntegration() {
  console.log('🔍 Diagnosing WhatsApp Integration Issues...\n');
  
  // 1. Check API Health
  console.log('1️⃣ Checking API Health...');
  try {
    const healthResponse = await axios.get('https://campuspe-api-staging.azurewebsites.net/api/health', { timeout: 10000 });
    console.log('✅ Azure API is healthy:', healthResponse.data);
  } catch (error) {
    console.log('❌ Azure API health check failed:', error.message);
    console.log('💡 Trying localhost...');
    try {
      const localHealthResponse = await axios.get('http://localhost:5001/api/health', { timeout: 5000 });
      console.log('✅ Local API is healthy');
    } catch (localError) {
      console.log('❌ Local API also unavailable');
    }
  }
  
  console.log('\n2️⃣ Testing WABB endpoint availability...');
  
  // Test both local and Azure endpoints
  const endpoints = [
    'http://localhost:5001/api/wabb/health',
    'https://campuspe-api-staging.azurewebsites.net/api/wabb/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, { timeout: 10000 });
      console.log(`✅ ${endpoint} - Available:`, response.data);
    } catch (error) {
      console.log(`❌ ${endpoint} - Failed:`, error.message);
    }
  }
  
  console.log('\n3️⃣ Testing generate-and-share payload...');
  
  const testData = {
    name: "WhatsApp Test User",
    email: "whatsapptest@campuspe.com",
    phone: "919156621088",
    jobDescription: "Looking for a full-stack developer with React and Node.js experience for a startup environment."
  };
  
  // Test with localhost first
  try {
    console.log('🧪 Testing localhost generate-and-share...');
    const response = await axios.post('http://localhost:5001/api/wabb/generate-and-share', testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ Localhost Response:', response.data);
  } catch (error) {
    console.log('❌ Localhost Error:', error.response?.data || error.message);
    
    if (error.response?.data?.message?.includes('Student profile not found')) {
      console.log('💡 User not found - this should trigger WABB webhook for registration');
    }
  }
  
  console.log('\n4️⃣ WhatsApp Service Configuration Check...');
  
  // Test WhatsApp service directly
  try {
    const testWhatsAppResponse = await axios.post('http://localhost:5001/api/wabb/test-whatsapp', {
      phone: "919156621088",
      message: "🧪 Testing WhatsApp service from diagnostic script"
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ WhatsApp Test Response:', testWhatsAppResponse.data);
  } catch (error) {
    console.log('❌ WhatsApp Test Error:', error.response?.data || error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('- The generate-and-share endpoint should work when:');
  console.log('  1. User exists in CampusPe database (for resume generation)');
  console.log('  2. WABB webhook URLs are properly configured');
  console.log('  3. WhatsApp service has valid credentials');
  console.log('\n- If user doesn\'t exist, it should:');
  console.log('  1. Send a WABB webhook with "User not found" message');
  console.log('  2. This triggers WABB to handle user registration flow');
  console.log('\n💡 Check WABB.in dashboard for webhook delivery logs');
}

diagnoseWhatsAppIntegration();
