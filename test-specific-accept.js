const axios = require('axios');

async function testSpecificAccept() {
  try {
    console.log('=== TESTING SPECIFIC CONNECTION ACCEPT ===\n');
    
    // Login as college
    console.log('1. Logging in as college...');
    const collegeLogin = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'ankitalokhande1904@gmail.com',
      password: 'test123'
    });
    
    console.log('✅ College login successful');
    const token = collegeLogin.data.token;
    
    // Try to accept the specific connection where college is target
    const connectionId = '689f178a947fcc1efbab4398';
    console.log('\n2. Attempting to accept connection:', connectionId);
    
    try {
      const acceptResponse = await axios.post(
        `http://localhost:5001/api/connections/${connectionId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Accept successful!');
      console.log('Response:', acceptResponse.data);
      
    } catch (error) {
      console.error('❌ Accept failed:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
    
    // Get updated connections
    console.log('\n3. Fetching updated connections...');
    const connectionsResponse = await axios.get('http://localhost:5001/api/connections', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedConnection = connectionsResponse.data.find(c => c._id === connectionId);
    if (updatedConnection) {
      console.log('Updated connection status:', updatedConnection.status);
      console.log('Accepted at:', updatedConnection.acceptedAt);
    } else {
      console.log('Connection not found in updated list');
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

testSpecificAccept();
