const axios = require('axios');

// Base URL for API
const API_BASE = 'http://localhost:5001/api';

// Test credentials
const recruiterCreds = {
  email: 'premthakare96680@gmail.com',
  password: 'pppppp'
};

const collegeCreds = {
  email: 'prem_thakare@campuspe.com',
  password: 'pppppp'
};

async function testInvitationFlow() {
  try {
    console.log('🔧 Testing CampusPe Invitation Flow...\n');
    
    // 1. Login as Recruiter
    console.log('1️⃣ Logging in as Recruiter...');
    const recruiterLoginResponse = await axios.post(`${API_BASE}/auth/login`, recruiterCreds);
    const recruiterToken = recruiterLoginResponse.data.token;
    console.log('✅ Recruiter logged in successfully');
    console.log('Recruiter ID:', recruiterLoginResponse.data.user.id);
    console.log('Recruiter Role:', recruiterLoginResponse.data.user.role);
    
    // 2. Get Recruiter's Jobs
    console.log('\n2️⃣ Fetching Recruiter\'s Jobs...');
    const jobsResponse = await axios.get(`${API_BASE}/jobs/recruiter-jobs`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    console.log('✅ Jobs fetched successfully');
    console.log('Total Jobs:', jobsResponse.data.length);
    
    if (jobsResponse.data.length === 0) {
      console.log('⚠️ No jobs found for recruiter. Creating a test job...');
      
      // Create a test job
      const testJob = {
        title: 'Test Software Engineer Position',
        description: 'Test job for invitation flow testing',
        requirements: ['JavaScript', 'Node.js', 'React'],
        location: 'Mumbai',
        salary: { min: 50000, max: 80000 },
        type: 'full-time',
        experience: 'entry-level'
      };
      
      const createJobResponse = await axios.post(`${API_BASE}/jobs`, testJob, {
        headers: { Authorization: `Bearer ${recruiterToken}` }
      });
      
      console.log('✅ Test job created:', createJobResponse.data.title);
      jobsResponse.data = [createJobResponse.data];
    }
    
    const firstJob = jobsResponse.data[0];
    console.log('Using Job:', firstJob.title, '(ID:', firstJob._id, ')');
    
    // 3. Login as College and Get College Profile
    console.log('\n3️⃣ Logging in as College...');
    const collegeLoginResponse = await axios.post(`${API_BASE}/auth/login`, collegeCreds);
    const collegeToken = collegeLoginResponse.data.token;
    console.log('✅ College logged in successfully');
    console.log('College User ID:', collegeLoginResponse.data.user.id);
    console.log('College Role:', collegeLoginResponse.data.user.role);
    
    // Get College Profile to find the actual college ID
    const collegeProfileResponse = await axios.get(`${API_BASE}/colleges/profile`, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    const collegeId = collegeProfileResponse.data._id;
    console.log('College Profile ID:', collegeId);
    
    // 4. Create Job Invitation
    console.log('\n4️⃣ Creating Job Invitation...');
    const invitationData = {
      targetColleges: [collegeId],
      invitationMessage: 'We would like to invite your students to apply for this position.',
      proposedDates: [
        {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
          isFlexible: true,
          preferredTimeSlots: ['morning', 'afternoon']
        },
        {
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          isFlexible: true,
          preferredTimeSlots: ['morning']
        }
      ],
      eligibilityCriteria: {
        courses: ['Computer Science', 'Information Technology'],
        graduationYear: 2025,
        minCGPA: 7.0,
        maxStudents: 50
      },
      expiresInDays: 7
    };
    
    const invitationResponse = await axios.post(
      `${API_BASE}/jobs/${firstJob._id}/invitations`, 
      invitationData,
      { headers: { Authorization: `Bearer ${recruiterToken}` } }
    );
    
    console.log('✅ Job invitation created successfully!');
    console.log('Invitation ID:', invitationResponse.data._id);
    console.log('Target College:', invitationResponse.data.targetCollege);
    console.log('Status:', invitationResponse.data.status);
    
    // 5. Check College Dashboard for Invitations
    console.log('\n5️⃣ Checking College Dashboard...');
    const dashboardResponse = await axios.get(`${API_BASE}/colleges/invitations`, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    
    console.log('✅ College dashboard loaded successfully');
    console.log('Invitations count:', dashboardResponse.data.invitations?.length || 0);
    
    if (dashboardResponse.data.invitations && dashboardResponse.data.invitations.length > 0) {
      console.log('Recent invitations:');
      dashboardResponse.data.invitations.slice(0, 3).forEach((inv, index) => {
        console.log(`  ${index + 1}. ${inv.job?.title || 'Unknown Job'} - Status: ${inv.status}`);
      });
    }
    
    // 6. Test Invitation Response
    console.log('\n6️⃣ Testing Invitation Response...');
    const responseData = {
      status: 'accepted',
      message: 'Thank you for the invitation. We accept this opportunity.'
    };
    
    const responseResult = await axios.post(
      `${API_BASE}/invitations/${invitationResponse.data._id}/respond`,
      responseData,
      { headers: { Authorization: `Bearer ${collegeToken}` } }
    );
    
    console.log('✅ Invitation response submitted successfully!');
    console.log('Updated Status:', responseResult.data.status);
    console.log('Response Message:', responseResult.data.responseMessage);
    
    console.log('\n🎉 All tests passed! Invitation flow is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testInvitationFlow();
