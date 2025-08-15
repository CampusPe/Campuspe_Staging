const axios = require('axios');

async function testDecline() {
  try {
    console.log('=== TESTING DECLINE FUNCTIONALITY ===\n');
    
    // Login as recruiter to test declining from their side
    console.log('1. Logging in as recruiter...');
    const recruiterLogin = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'ankita_lokhande@campuspe.com',
      password: 'test123'
    });
    
    console.log('✅ Recruiter login successful');
    const token = recruiterLogin.data.token;
    
    // Get connections to find one to decline
    const connectionsResponse = await axios.get('http://localhost:5001/api/connections', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const pendingIncoming = connectionsResponse.data.filter(conn => 
      conn.status === 'pending' && !conn.isRequester
    );
    
    console.log('\\n2. Found', pendingIncoming.length, 'pending incoming connections');
    
    if (pendingIncoming.length > 0) {
      const connectionToDecline = pendingIncoming[0];
      console.log('Testing decline on connection:', connectionToDecline._id);
      console.log('From:', connectionToDecline.requester.name);
      
      try {
        const declineResponse = await axios.post(
          `http://localhost:5001/api/connections/${connectionToDecline._id}/decline`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('✅ Decline successful!');
        console.log('Response:', declineResponse.data.message);
        
        // Verify status change
        const updatedConnections = await axios.get('http://localhost:5001/api/connections', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const updatedConnection = updatedConnections.data.find(c => c._id === connectionToDecline._id);
        console.log('Updated status:', updatedConnection?.status);
        
      } catch (error) {
        console.error('❌ Decline failed:');
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        } else {
          console.error('Error:', error.message);
        }
      }
    } else {
      console.log('No pending incoming connections to test decline');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDecline();
