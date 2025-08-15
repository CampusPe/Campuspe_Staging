#!/usr/bin/env node

const API_BASE_URL = 'http://localhost:5001/api';

async function testResendInvitation() {
  console.log('🔄 Testing Resend Invitation Functionality...\n');

  try {
    // 1. Login as recruiter
    console.log('1. Logging in as recruiter...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'premthakare96680@gmail.com',
        password: 'pppppp'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    const recruiterToken = loginData.data.token;
    console.log('✅ Recruiter login successful');

    // 2. Get recruiter's jobs to find invitation
    console.log('\n2. Fetching recruiter jobs...');
    const jobsResponse = await fetch(`${API_BASE_URL}/jobs/recruiter`, {
      headers: {
        'Authorization': `Bearer ${recruiterToken}`,
        'Content-Type': 'application/json',
      },
    });

    const jobsData = await jobsResponse.json();
    if (!jobsData.success || !jobsData.data.jobs.length) {
      throw new Error('No jobs found for recruiter');
    }

    const firstJob = jobsData.data.jobs[0];
    console.log(`✅ Found job: ${firstJob.title} (ID: ${firstJob.id})`);

    // 3. Get invitations for this job
    console.log('\n3. Fetching job invitations...');
    const invitationsResponse = await fetch(`${API_BASE_URL}/jobs/${firstJob.id}/invitations`, {
      headers: {
        'Authorization': `Bearer ${recruiterToken}`,
        'Content-Type': 'application/json',
      },
    });

    const invitationsData = await invitationsResponse.json();
    if (!invitationsData.success) {
      throw new Error(`Failed to fetch invitations: ${invitationsData.message}`);
    }

    console.log(`✅ Found ${invitationsData.data.total} invitations`);
    
    // Find a declined invitation for testing resend
    const declinedInvitation = invitationsData.data.invitations.find(inv => inv.status === 'declined');
    
    if (!declinedInvitation) {
      console.log('⚠️  No declined invitations found. Creating a test scenario...');
      
      // Use the first invitation and artificially set it to declined for testing
      if (invitationsData.data.invitations.length > 0) {
        const testInvitation = invitationsData.data.invitations[0];
        console.log(`📝 Using invitation ID: ${testInvitation.id} for testing`);
        
        // Test the resend endpoint (this will fail if invitation is not declined, but we can see the response)
        console.log('\n4. Testing resend invitation...');
        const resendResponse = await fetch(`${API_BASE_URL}/invitations/${testInvitation.id}/resend`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${recruiterToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newMessage: 'Updated invitation with new details - please reconsider our offer!',
            newProposedDates: ['2024-02-15', '2024-02-16', '2024-02-17'],
            expiresInDays: 10
          })
        });

        const resendData = await resendResponse.json();
        console.log('📤 Resend Response:', {
          status: resendResponse.status,
          success: resendData.success,
          message: resendData.message,
          currentStatus: resendData.currentStatus
        });

        if (resendData.success) {
          console.log('✅ Resend successful!');
          console.log('📊 Updated invitation data:', resendData.data);
        } else {
          console.log(`⚠️  Expected error (invitation not in declined/expired status): ${resendData.message}`);
        }
      }
    } else {
      console.log(`📝 Found declined invitation: ${declinedInvitation.id}`);
      
      // Test resend on declined invitation
      console.log('\n4. Testing resend on declined invitation...');
      const resendResponse = await fetch(`${API_BASE_URL}/invitations/${declinedInvitation.id}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${recruiterToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newMessage: 'We have updated our offer and terms. Please reconsider this opportunity!',
          newProposedDates: ['2024-02-20', '2024-02-21', '2024-02-22'],
          expiresInDays: 14
        })
      });

      const resendData = await resendResponse.json();
      console.log('📤 Resend Response:', {
        status: resendResponse.status,
        success: resendData.success,
        message: resendData.message
      });

      if (resendData.success) {
        console.log('✅ Resend successful!');
        console.log('📊 Updated invitation:', resendData.data.invitation);
      } else {
        console.log(`❌ Resend failed: ${resendData.message}`);
      }
    }

    // 5. Test API endpoint structure
    console.log('\n5. Testing API endpoint accessibility...');
    const endpointTests = [
      '/invitations',
      '/jobs',
      '/colleges/invitations'
    ];

    for (const endpoint of endpointTests) {
      const testResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${recruiterToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`${endpoint}: ${testResponse.status} ${testResponse.statusText}`);
    }

    console.log('\n🎉 Resend invitation functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testResendInvitation();
