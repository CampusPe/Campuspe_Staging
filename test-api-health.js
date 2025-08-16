const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

async function testAPIHealth() {
  console.log('🏥 Testing API Health...\n');

  try {
    // Test basic health
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ API Health Check:', healthResponse.status);
    console.log('📄 Health Response:', healthResponse.data);

    // Test root endpoint
    const rootResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Root Endpoint:', rootResponse.status);
    console.log('📄 Root Response:', rootResponse.data);

    console.log('\n🎉 API is running correctly!');
  } catch (error) {
    console.log('❌ API Health Check Failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 The API server is not running. Please start it with:');
      console.log('   cd apps/api && npm run dev');
    }
  }
}

testAPIHealth();
