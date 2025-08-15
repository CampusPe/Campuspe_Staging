const axios = require('axios');

async function checkAPIResponse() {
  try {
    console.log('=== CHECKING API RESPONSE FOR COLLEGE USER ===\n');
    
    console.log('1. Attempting login...');
    // Login as college
    const collegeLogin = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'ankitalokhande1904@gmail.com',
      password: 'test123'
    });
    
    console.log('2. Login successful, getting token...');
    const token = collegeLogin.data.token;
    
    console.log('3. Fetching connections...');
    // Get connections
    const connectionsResponse = await axios.get('http://localhost:5001/api/connections', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('API returned', connectionsResponse.data.length, 'connections:');
    
    connectionsResponse.data.forEach((conn, index) => {
      console.log(`\nConnection ${index + 1}:`);
      console.log('  ID:', conn._id);
      console.log('  Status:', conn.status);
      console.log('  isRequester:', conn.isRequester);
      console.log('  Requester:', conn.requester.name, '(', conn.requester.email, ')');
      console.log('  Target:', conn.target.name, '(', conn.target.email, ')');
      
      if (conn._id === '689f1af36289a31973956ce6') {
        console.log('  ⚠️  THIS IS THE PROBLEMATIC CONNECTION');
        console.log('  Should be in SENT requests (isRequester: true)');
        console.log('  Should NOT have Accept/Decline buttons');
      }
    });
    
    const incomingRequests = connectionsResponse.data.filter(conn => 
      conn.status === 'pending' && !conn.isRequester
    );
    const sentRequests = connectionsResponse.data.filter(conn => 
      conn.status === 'pending' && conn.isRequester
    );
    
    console.log('\n=== FILTERED RESULTS ===');
    console.log('Incoming requests (can accept/decline):', incomingRequests.length);
    console.log('Sent requests (cannot accept/decline):', sentRequests.length);
    
    incomingRequests.forEach((conn, index) => {
      console.log(`\nIncoming ${index + 1}: ${conn._id} - from ${conn.requester.name}`);
    });
    
    sentRequests.forEach((conn, index) => {
      console.log(`\nSent ${index + 1}: ${conn._id} - to ${conn.target.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

checkAPIResponse();
