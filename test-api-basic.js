// Simple test script to check API endpoints without authentication
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

async function testPublicEndpoints() {
  console.log('🔍 Testing Public API Endpoints...\n');

  try {
    // Test health endpoint
    console.log('1️⃣ Testing GET /health');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Status:', healthResponse.status);
    console.log('📊 Health Data:', healthResponse.data);
    console.log('');

    // Test root endpoint
    console.log('2️⃣ Testing GET /');
    const rootResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Root Status:', rootResponse.status);
    console.log('🏠 Root Data:', rootResponse.data);
    console.log('');

    // Test if API accepts student profile requests (should return 401 without auth)
    console.log('3️⃣ Testing GET /api/students/profile (should return 401)');
    try {
      const profileResponse = await axios.get(`${API_BASE_URL}/api/students/profile`);
      console.log('⚠️ Unexpected success:', profileResponse.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correct 401 Unauthorized response');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    console.log('');

    console.log('🎉 Basic API connectivity tests completed successfully!');
    console.log('💡 Next step: Test with valid authentication token from browser');

  } catch (error) {
    console.log('❌ API Test Failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the API server is running on port 5001');
    }
  }
}

testPublicEndpoints();
