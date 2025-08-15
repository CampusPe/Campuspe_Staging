const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testConnectionsAndResend() {
  try {
    console.log('🧪 Testing Connections and Resend Functionality...\n');
    
    // 1. Login as recruiter
    console.log('1. Logging in as recruiter...');
    let loginResponse;
    
    // Try multiple potential recruiter emails from database
    const potentialEmails = [
      'test_recruiter@campuspe.com', // Our new test account
      'premthakare96680@gmail.com',
      'ankita_lokhande@campuspe.com',
      'recruiter@test.com'
    ];
    
    let loginSuccessful = false;
    let token;
    
    for (const email of potentialEmails) {
      try {
        console.log(`  Trying: ${email}`);
        loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: email,
          password: 'pppppp'
        });
        
        if (loginResponse.data.token) {
          token = loginResponse.data.token;
          loginSuccessful = true;
          console.log(`✅ Login successful with: ${email}`);
          break;
        }
      } catch (err) {
        console.log(`  ❌ Failed with: ${email} - ${err.response?.data?.message || err.message}`);
      }
    }
    
    if (!loginSuccessful) {
      throw new Error('Failed to login with any of the test credentials');
    }

    console.log('✅ Recruiter login successful');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // 2. Test getting connections (this should now work with our fix)
    console.log('2. Testing GET /connections...');
    const connectionsResponse = await axios.get(`${API_BASE_URL}/connections`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Connections fetched successfully');
    console.log('Connections count:', connectionsResponse.data.connections.length);
    
    if (connectionsResponse.data.connections.length > 0) {
      console.log('Sample connection:');
      const connection = connectionsResponse.data.connections[0];
      console.log(`- ID: ${connection._id}`);
      console.log(`- Requester: ${connection.requesterName || 'Unknown'} (${connection.requesterEmail || 'No email'})`);
      console.log(`- Target: ${connection.targetName || 'Unknown'} (${connection.targetEmail || 'No email'})`);
      console.log(`- Status: ${connection.status}`);
    }

    // 3. Test getting invitations
    console.log('\n3. Testing GET /invitations...');
    const invitationsResponse = await axios.get(`${API_BASE_URL}/invitations`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Invitations fetched successfully');
    console.log('Invitations count:', invitationsResponse.data.invitations.length);
    
    if (invitationsResponse.data.invitations.length > 0) {
      const invitation = invitationsResponse.data.invitations[0];
      console.log('Sample invitation:');
      console.log(`- ID: ${invitation._id}`);
      console.log(`- Status: ${invitation.status}`);
      console.log(`- College: ${invitation.college?.name || 'Unknown'}`);
      console.log(`- Created: ${invitation.createdAt}`);

      // 4. Test resend functionality (if invitation exists)
      if (invitation.status === 'pending') {
        console.log('\n4. Testing invitation resend...');
        const resendResponse = await axios.post(`${API_BASE_URL}/invitations/${invitation._id}/resend`, {}, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Invitation resent successfully');
        console.log('Resend response:', resendResponse.data.message);
      } else {
        console.log('\n4. Skipping resend test - no pending invitations found');
      }
    } else {
      console.log('\n4. Skipping resend test - no invitations found');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testConnectionsAndResend();
