const axios = require('axios');

async function testInvitationResponse() {
  try {
    const API_BASE = 'http://localhost:5001/api';
    
    // Login as college
    console.log('🔧 Logging in as college...');
    const collegeLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'prem_thakare@campuspe.com', 
      password: 'pppppp'
    });
    
    const collegeToken = collegeLogin.data.token;
    
    // Use the invitation ID from our previous test
    const invitationId = '689ec1c9d215b3db90a99c0e';
    
    console.log('\n📝 Testing invitation response...');
    const responseData = {
      status: 'accepted',
      message: 'Thank you for the invitation. We accept this opportunity and look forward to hosting your recruitment drive.',
      visitWindow: {
        confirmedStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        confirmedEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        visitMode: 'physical',
        maxStudents: 50
      }
    };
    
    const response = await axios.post(
      `${API_BASE}/colleges/invitations/${invitationId}/accept`,
      responseData,
      { headers: { Authorization: `Bearer ${collegeToken}` } }
    );
    
    console.log('✅ Invitation response successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check updated invitation status
    console.log('\n🔄 Checking updated invitation status...');
    const updatedInvitations = await axios.get(`${API_BASE}/colleges/invitations`, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    
    const updatedInvitation = updatedInvitations.data.data.invitations.find(inv => inv.id === invitationId);
    console.log('Updated Status:', updatedInvitation?.status);
    console.log('Response Message:', updatedInvitation?.tpoResponse?.responseMessage);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testInvitationResponse();
