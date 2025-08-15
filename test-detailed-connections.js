const axios = require('axios');

async function detailedConnectionsTest() {
  try {
    console.log('=== DETAILED CONNECTIONS TEST ===\n');
    
    // Login as recruiter
    console.log('1. Logging in as recruiter...');
    const recruiterLogin = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'ankita_lokhande@campuspe.com',
      password: 'test123'
    });
    
    console.log('✅ Login successful');
    console.log('User ID:', recruiterLogin.data.user.id);
    console.log('Role:', recruiterLogin.data.user.role);
    
    const token = recruiterLogin.data.token;
    
    // Test connections with debug headers
    console.log('\n2. Testing connections API...');
    const response = await axios.get('http://localhost:5001/api/connections', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'User-Agent': 'test-script'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Test with college user
    console.log('\n\n3. Testing with college user...');
    const collegeLogin = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'ankitalokhande1904@gmail.com',
      password: 'test123'
    });
    
    console.log('✅ College login successful');
    console.log('User ID:', collegeLogin.data.user.id);
    console.log('Role:', collegeLogin.data.user.role);
    
    const collegeToken = collegeLogin.data.token;
    
    const collegeResponse = await axios.get('http://localhost:5001/api/connections', {
      headers: { 
        Authorization: `Bearer ${collegeToken}`,
        'User-Agent': 'test-script'
      }
    });
    
    console.log('Response status:', collegeResponse.status);
    console.log('Response data:', JSON.stringify(collegeResponse.data, null, 2));
    
  } catch (error) {
    console.error('Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

detailedConnectionsTest();
