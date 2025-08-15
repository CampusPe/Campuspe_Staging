const axios = require('axios');

async function testConnectionsWithAuth() {
  console.log('🧪 Testing Connections API with Authentication...');
  
  try {
    // First, let's login with the recruiter credentials
    console.log('1. Logging in as recruiter...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'ankita_lokhande@campuspe.com',
      password: '1234'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received:', token.substring(0, 30) + '...');
    
    // Now test the connections API
    console.log('2. Fetching connections...');
    const connectionsResponse = await axios.get('http://localhost:5001/api/connections', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Connections API Response:');
    console.log('Status:', connectionsResponse.status);
    console.log('Data length:', connectionsResponse.data.length);
    console.log('Connections:', JSON.stringify(connectionsResponse.data, null, 2));
    
    // Test with college login too
    console.log('\n3. Testing with college login...');
    const collegeLoginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'ankitalokhande1904@gmail.com',
      password: '1234'
    });
    
    const collegeToken = collegeLoginResponse.data.token;
    console.log('✅ College login successful');
    
    const collegeConnectionsResponse = await axios.get('http://localhost:5001/api/connections', {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    
    console.log('✅ College Connections API Response:');
    console.log('Status:', collegeConnectionsResponse.status);
    console.log('Data length:', collegeConnectionsResponse.data.length);
    console.log('College Connections:', JSON.stringify(collegeConnectionsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testConnectionsWithAuth();
