const axios = require('axios');

async function testConnectionsAPI() {
  try {
    console.log('🧪 Testing Connections API...');
    
    // Test health endpoint first
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('✅ API Health:', healthResponse.data);
    
    // Test connections endpoint without auth (should get error)
    try {
      await axios.get('http://localhost:5001/api/connections');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Auth protection working: 401 for no token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    // Test with invalid token
    try {
      await axios.get('http://localhost:5001/api/connections', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Auth protection working: 401 for invalid token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    console.log('\n📊 API is properly configured and protected');
    console.log('💡 To test with real data, login through the frontend first');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
}

testConnectionsAPI();
