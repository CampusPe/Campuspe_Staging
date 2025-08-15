const axios = require('axios');

async function debugInvitations() {
  try {
    const API_BASE = 'http://localhost:5001/api';
    
    // Login as recruiter
    console.log('🔧 Logging in as recruiter...');
    const recruiterLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'premthakare96680@gmail.com',
      password: 'pppppp'
    });
    
    // Login as college
    console.log('🔧 Logging in as college...');
    const collegeLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'prem_thakare@campuspe.com', 
      password: 'pppppp'
    });
    
    const collegeToken = collegeLogin.data.token;
    
    // Get college profile
    const collegeProfile = await axios.get(`${API_BASE}/colleges/profile`, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    
    console.log('College User ID:', collegeLogin.data.user.id);
    console.log('College Profile ID:', collegeProfile.data._id);
    
    // Test the debug invitation endpoint
    console.log('\n🔧 Testing debug invitation endpoint...');
    const debugResponse = await axios.get(`${API_BASE}/invitations/debug`, {
      headers: { Authorization: `Bearer ${recruiterLogin.data.token}` }
    });
    
    console.log('Debug response:', JSON.stringify(debugResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

debugInvitations();
