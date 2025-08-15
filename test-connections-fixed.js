const axios = require('axios');

async function testConnectionsAPI() {
  try {
    console.log('Testing connections API with fixed ID handling...\n');
    
    // Test with recruiter credentials
    const recruiterLoginData = {
      email: 'ankita_lokhande@campuspe.com',
      password: 'test123'
    };
    
    // Login as recruiter
    console.log('1. Logging in as recruiter...');
    const recruiterLogin = await axios.post('http://localhost:5001/api/auth/login', recruiterLoginData);
    const recruiterToken = recruiterLogin.data.token;
    console.log('✅ Recruiter login successful');
    
    // Get connections for recruiter
    console.log('\n2. Fetching connections for recruiter...');
    const recruiterConnections = await axios.get('http://localhost:5001/api/connections', {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    
    console.log('Response status:', recruiterConnections.status);
    console.log('Number of connections:', recruiterConnections.data.length);
    
    if (recruiterConnections.data.length > 0) {
      console.log('\n✅ SUCCESS! Found connections:');
      recruiterConnections.data.forEach((conn, index) => {
        console.log(`\nConnection ${index + 1}:`);
        console.log('  ID:', conn._id);
        console.log('  Status:', conn.status);
        console.log('  Requester:', conn.requester.name, '(', conn.requester.email, ')');
        console.log('  Target:', conn.target.name, '(', conn.target.email, ')');
        console.log('  Created:', new Date(conn.createdAt).toLocaleString());
      });
    } else {
      console.log('❌ Still no connections found for recruiter');
    }
    
    // Test with college credentials
    console.log('\n\n3. Testing with college credentials...');
    const collegeLoginData = {
      email: 'ankitalokhande1904@gmail.com',
      password: 'test123'
    };
    
    // Login as college
    console.log('Logging in as college...');
    const collegeLogin = await axios.post('http://localhost:5001/api/auth/login', collegeLoginData);
    const collegeToken = collegeLogin.data.token;
    console.log('✅ College login successful');
    
    // Get connections for college
    console.log('\nFetching connections for college...');
    const collegeConnections = await axios.get('http://localhost:5001/api/connections', {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    
    console.log('Response status:', collegeConnections.status);
    console.log('Number of connections:', collegeConnections.data.length);
    
    if (collegeConnections.data.length > 0) {
      console.log('\n✅ SUCCESS! Found connections:');
      collegeConnections.data.forEach((conn, index) => {
        console.log(`\nConnection ${index + 1}:`);
        console.log('  ID:', conn._id);
        console.log('  Status:', conn.status);
        console.log('  Requester:', conn.requester.name, '(', conn.requester.email, ')');
        console.log('  Target:', conn.target.name, '(', conn.target.email, ')');
        console.log('  Created:', new Date(conn.createdAt).toLocaleString());
      });
    } else {
      console.log('❌ Still no connections found for college');
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

testConnectionsAPI();
