const axios = require('axios');

async function checkInvitations() {
  try {
    const API_BASE = 'http://localhost:5001/api';
    
    // Login as college
    console.log('🔧 Logging in as college...');
    const collegeLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'prem_thakare@campuspe.com', 
      password: 'pppppp'
    });
    
    const collegeToken = collegeLogin.data.token;
    
    // Get college invitations using the actual route
    console.log('\n🔧 Getting college invitations...');
    const invitationsResponse = await axios.get(`${API_BASE}/colleges/invitations`, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    
    console.log('Invitations response:', JSON.stringify(invitationsResponse.data, null, 2));
    
    // Get college profile
    const collegeProfile = await axios.get(`${API_BASE}/colleges/profile`, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    
    console.log('\nCollege Profile ID:', collegeProfile.data._id);
    console.log('College User ID:', collegeLogin.data.user.id);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

checkInvitations();
