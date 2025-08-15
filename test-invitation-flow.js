const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test credentials
const recruiterEmail = 'premthakare96680@gmail.com';
const recruiterPassword = 'pppppp';
const collegeEmail = 'prem_thakare@campuspe.com';
const collegePassword = 'pppppp';

async function testInvitationFlow() {
  try {
    console.log('=== Testing Invitation Flow ===\n');

    // 1. Login as recruiter
    console.log('1. Logging in as recruiter...');
    const recruiterLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: recruiterEmail,
      password: recruiterPassword
    });
    
    const recruiterToken = recruiterLogin.data.token;
    console.log('✓ Recruiter logged in successfully');

    // 2. Get recruiter jobs
    console.log('\n2. Fetching recruiter jobs...');
    const jobsResponse = await axios.get(`${API_BASE_URL}/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    
    console.log(`✓ Found ${jobsResponse.data.length} jobs`);
    
    if (jobsResponse.data.length === 0) {
      console.log('ℹ No jobs found. Please create a job first from the dashboard.');
      return;
    }

    const firstJob = jobsResponse.data[0];
    console.log(`✓ Using job: ${firstJob.title} (ID: ${firstJob._id})`);

    // 3. Get colleges
    console.log('\n3. Fetching colleges...');
    const collegesResponse = await axios.get(`${API_BASE_URL}/colleges`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    
    console.log(`✓ Found ${collegesResponse.data.length} colleges`);
    
    if (collegesResponse.data.length === 0) {
      console.log('ℹ No colleges found.');
      return;
    }

    const firstCollege = collegesResponse.data[0];
    console.log(`✓ Using college: ${firstCollege.name || firstCollege.collegeName}`);

    // 4. Create invitation
    console.log('\n4. Creating invitation...');
    const invitationData = {
      targetColleges: [firstCollege._id],
      invitationMessage: 'Test invitation for campus recruitment',
      proposedDates: [{
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        isFlexible: true,
        preferredTimeSlots: ['morning']
      }],
      expiresInDays: 30
    };

    const invitationResponse = await axios.post(
      `${API_BASE_URL}/jobs/${firstJob._id}/invitations`,
      invitationData,
      { headers: { Authorization: `Bearer ${recruiterToken}` } }
    );
    
    console.log('✓ Invitation created successfully!');
    console.log('Response:', invitationResponse.data);

    // 5. Login as college and check invitations
    console.log('\n5. Logging in as college...');
    const collegeLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: collegeEmail,
      password: collegePassword
    });
    
    const collegeToken = collegeLogin.data.token;
    console.log('✓ College logged in successfully');

    // 6. Check college invitations
    console.log('\n6. Fetching college invitations...');
    const collegeInvitations = await axios.get(`${API_BASE_URL}/colleges/invitations`, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    
    console.log(`✓ Found ${collegeInvitations.data.data?.total || 0} invitations`);
    console.log('Invitations:', collegeInvitations.data);

    console.log('\n=== Test Completed Successfully! ===');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Config:', error.config);
  }
}

testInvitationFlow();
