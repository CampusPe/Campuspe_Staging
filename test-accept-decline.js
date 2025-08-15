const axios = require('axios');

async function testAcceptDecline() {
  try {
    console.log('=== TESTING ACCEPT/DECLINE FUNCTIONALITY ===\n');
    
    // Login as college (to accept connections sent to college)
    console.log('1. Logging in as college...');
    const collegeLogin = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'ankitalokhande1904@gmail.com',
      password: 'test123'
    });
    
    console.log('✅ College login successful');
    console.log('User ID:', collegeLogin.data.user.id);
    console.log('Role:', collegeLogin.data.user.role);
    
    const token = collegeLogin.data.token;
    
    // Get connections first
    console.log('\n2. Fetching connections...');
    const connectionsResponse = await axios.get('http://localhost:5001/api/connections', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Found', connectionsResponse.data.length, 'connections');
    
    const pendingConnections = connectionsResponse.data.filter(conn => 
      conn.status === 'pending' && !conn.isRequester
    );
    
    console.log('Incoming pending connections:', pendingConnections.length);
    
    if (pendingConnections.length > 0) {
      const connectionToTest = pendingConnections[0];
      console.log('\n3. Testing accept on connection:', connectionToTest._id);
      console.log('From:', connectionToTest.requester.name, '(', connectionToTest.requester.email, ')');
      console.log('Message:', connectionToTest.message);
      
      try {
        const acceptResponse = await axios.post(
          `http://localhost:5001/api/connections/${connectionToTest._id}/accept`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('✅ Accept successful!');
        console.log('Response:', acceptResponse.data.message);
        
        // Verify the connection status changed
        const updatedConnections = await axios.get('http://localhost:5001/api/connections', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const updatedConnection = updatedConnections.data.find(c => c._id === connectionToTest._id);
        console.log('Updated status:', updatedConnection?.status);
        
      } catch (error) {
        console.error('❌ Accept failed:');
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        } else {
          console.error('Error:', error.message);
        }
      }
    } else {
      console.log('No pending incoming connections to test accept');
    }
    
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

testAcceptDecline();
