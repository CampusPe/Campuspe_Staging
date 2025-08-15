const axios     // Try multiple potential recruiter emails
    const potentialEmails = [
      'premthakare96680@gmail.com',
      'ankita_lokhande@campuspe.com',
      'recruiter@test.com'
    ];ire('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testConnectionsAndResend() {
  try {
    console.log('🧪 Testing Connections and Resend Functionality...\n');
    
    // 1. Login as recruiter
    console.log('1. Logging in as recruiter...');
    let loginResponse;
    
    // Try multiple potential recruiter emails
    const potentialEmails = [
      'premthakare96680@gmail.com',
      'prem_thakare@campuspe.com',
      'admin@abcsolutions.com'
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
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Recruiter login successful');

    // 2. Test connections endpoint
    console.log('\n2. Testing connections endpoint...');
    try {
      const connectionsResponse = await axios.get(`${API_BASE_URL}/connections`, { headers });
      console.log(`✅ Connections fetched: ${connectionsResponse.data.length} connections found`);
      
      if (connectionsResponse.data.length > 0) {
        console.log('Sample connection:', JSON.stringify(connectionsResponse.data[0], null, 2));
      } else {
        console.log('No connections found - this is normal if no connections exist');
      }
    } catch (error) {
      console.error('❌ Connections fetch failed:', error.response?.data || error.message);
    }

    // 3. Test invitations endpoint
    console.log('\n3. Testing invitations fetching...');
    try {
      const invitationsResponse = await axios.get(`${API_BASE_URL}/invitations`, { headers });
      console.log(`✅ Invitations fetched successfully`);
      
      const invitations = invitationsResponse.data.data?.invitations || invitationsResponse.data || [];
      console.log(`Found ${invitations.length} invitations`);
      
      if (invitations.length > 0) {
        const firstInvitation = invitations[0];
        console.log('Sample invitation:', {
          id: firstInvitation.id || firstInvitation._id,
          status: firstInvitation.status,
          college: firstInvitation.college?.name || 'Unknown',
          job: firstInvitation.job?.title || 'Unknown'
        });

        // 4. Test resend functionality if there's a declined invitation
        const declinedInvitation = invitations.find(inv => inv.status === 'declined');
        if (declinedInvitation) {
          console.log('\n4. Testing invitation resend...');
          const resendData = {
            newMessage: 'Updated invitation with better terms - please reconsider!',
            expiresInDays: 14
          };
          
          try {
            const resendResponse = await axios.post(
              `${API_BASE_URL}/invitations/${declinedInvitation.id || declinedInvitation._id}/resend`,
              resendData,
              { headers }
            );
            console.log('✅ Resend successful:', resendResponse.data.message);
          } catch (resendError) {
            console.log('⚠️ Resend failed (expected if no declined invitations):', resendError.response?.data?.message);
          }
        } else {
          console.log('4. No declined invitations found for resend testing');
        }
      }
    } catch (error) {
      console.error('❌ Invitations fetch failed:', error.response?.data || error.message);
    }

    // 5. Test recruiter jobs endpoint
    console.log('\n5. Testing recruiter jobs...');
    try {
      const jobsResponse = await axios.get(`${API_BASE_URL}/jobs/recruiter-jobs`, { headers });
      const jobs = jobsResponse.data;
      console.log(`✅ Jobs fetched: ${Array.isArray(jobs) ? jobs.length : 'Invalid response'} jobs found`);
    } catch (error) {
      console.error('❌ Jobs fetch failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Wait for server to be ready
setTimeout(testConnectionsAndResend, 2000);
