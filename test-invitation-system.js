/**
 * Comprehensive Invitation System Test
 * Tests all invitation functionality between colleges and companies
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// Test credentials (update these with actual credentials)
const testCredentials = {
  college: {
    email: 'premthakare96680@gmail.com',
    password: 'pppppp'
  },
  recruiter: {
    email: 'prem_thakare@campuspe.com', 
        password: 'pppppp'
  }
};

let tokens = {};

async function login(role, credentials) {
  try {
    console.log(`🔐 Logging in as ${role}...`);
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    tokens[role] = response.data.token;
    console.log(`✅ ${role} login successful`);
    return response.data;
  } catch (error) {
    console.error(`❌ ${role} login failed:`, error.response?.data || error.message);
    throw error;
  }
}

async function createTestJob(recruiterToken) {
  try {
    console.log('📝 Creating test job...');
    const jobData = {
      title: 'Software Engineer',
      company: 'Test Company',
      description: 'Test job for college recruitment',
      requirements: ['JavaScript', 'React', 'Node.js'],
      salary: '8-12 LPA',
      location: 'Bangalore',
      type: 'full-time',
      eligibilityCriteria: {
        minCGPA: 7.0,
        allowedBranches: ['Computer Science', 'IT'],
        passingYear: 2024
      },
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isCollegeSpecific: true,
      targetColleges: [] // Will be filled with college IDs
    };

    const response = await axios.post(`${API_BASE}/jobs`, jobData, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });

    console.log('✅ Test job created:', response.data.job._id);
    return response.data.job;
  } catch (error) {
    console.error('❌ Job creation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testCollegeToRecruiterInvitation(collegeToken, recruiterId) {
  try {
    console.log('📬 Testing college to recruiter invitation...');
    
    const invitationData = {
      recipientId: recruiterId,
      recipientType: 'recruiter',
      subject: 'Placement Opportunity - Test College',
      message: 'We would like to invite your company for campus placement at our college.',
      type: 'placement'
    };

    const response = await axios.post(`${API_BASE}/invitations`, invitationData, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });

    console.log('✅ College to recruiter invitation sent:', response.data.invitation._id);
    return response.data.invitation;
  } catch (error) {
    console.error('❌ College to recruiter invitation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testRecruiterToCollegeInvitation(recruiterToken, collegeId, jobId) {
  try {
    console.log('📬 Testing recruiter to college invitation...');
    
    const invitationData = {
      recipientId: collegeId,
      recipientType: 'college',
      jobId: jobId,
      subject: 'Campus Recruitment Invitation',
      message: 'We would like to conduct campus recruitment at your college.',
      type: 'recruitment'
    };

    const response = await axios.post(`${API_BASE}/invitations`, invitationData, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });

    console.log('✅ Recruiter to college invitation sent:', response.data.invitation._id);
    return response.data.invitation;
  } catch (error) {
    console.error('❌ Recruiter to college invitation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testAutomaticInvitations(recruiterToken) {
  try {
    console.log('🤖 Testing automatic invitation sending for College-Specific jobs...');
    
    // Get approved colleges first
    const collegesResponse = await axios.get(`${API_BASE}/colleges/approved`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });

    const colleges = collegesResponse.data.colleges || [];
    console.log(`Found ${colleges.length} approved colleges`);

    if (colleges.length === 0) {
      console.log('⚠️ No approved colleges found for automatic invitations');
      return;
    }

    // Create college-specific job that should trigger automatic invitations
    const jobData = {
      title: 'Full Stack Developer - Auto Invite Test',
      company: 'Auto Test Company',
      description: 'Test job for automatic invitation system',
      requirements: ['Full Stack Development'],
      salary: '10-15 LPA',
      location: 'Mumbai',
      type: 'full-time',
      eligibilityCriteria: {
        minCGPA: 6.5,
        allowedBranches: ['Computer Science'],
        passingYear: 2024
      },
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isCollegeSpecific: true,
      targetColleges: colleges.slice(0, 3).map(c => c._id) // Send to first 3 colleges
    };

    const response = await axios.post(`${API_BASE}/jobs`, jobData, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });

    console.log('✅ College-specific job created:', response.data.job._id);
    console.log('🔄 Checking if automatic invitations were sent...');

    // Wait a bit for automatic processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if invitations were created
    const invitationsResponse = await axios.get(`${API_BASE}/invitations`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });

    const automaticInvitations = invitationsResponse.data.invitations.filter(
      inv => inv.jobId === response.data.job._id
    );

    console.log(`✅ ${automaticInvitations.length} automatic invitations sent`);
    return { job: response.data.job, invitations: automaticInvitations };

  } catch (error) {
    console.error('❌ Automatic invitation test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testInvitationResponse(token, invitationId, action) {
  try {
    console.log(`📝 Testing invitation ${action}...`);
    
    const response = await axios.post(`${API_BASE}/invitations/${invitationId}/respond`, {
      action: action,
      message: `Test ${action} response`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Invitation ${action} successful`);
    return response.data;
  } catch (error) {
    console.error(`❌ Invitation ${action} failed:`, error.response?.data || error.message);
    throw error;
  }
}

async function testResendInvitation(token, invitationId) {
  try {
    console.log('🔄 Testing invitation resend...');
    
    const response = await axios.post(`${API_BASE}/invitations/${invitationId}/resend`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Invitation resend successful');
    return response.data;
  } catch (error) {
    console.error('❌ Invitation resend failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getAllInvitations(token, userType) {
  try {
    console.log(`📋 Getting all invitations for ${userType}...`);
    
    const response = await axios.get(`${API_BASE}/invitations`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Found ${response.data.invitations.length} invitations`);
    return response.data.invitations;
  } catch (error) {
    console.error('❌ Failed to get invitations:', error.response?.data || error.message);
    throw error;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Invitation System Test\n');

  try {
    // Step 1: Login both users
    console.log('=== STEP 1: USER AUTHENTICATION ===');
    const collegeUser = await login('college', testCredentials.college);
    const recruiterUser = await login('recruiter', testCredentials.recruiter);
    console.log('');

    // Step 2: Test College to Recruiter Invitation
    console.log('=== STEP 2: COLLEGE TO RECRUITER INVITATION ===');
    const collegeToRecruiterInv = await testCollegeToRecruiterInvitation(
      tokens.college, 
      recruiterUser.user._id
    );
    console.log('');

    // Step 3: Test Recruiter to College Invitation
    console.log('=== STEP 3: RECRUITER TO COLLEGE INVITATION ===');
    const testJob = await createTestJob(tokens.recruiter);
    const recruiterToCollegeInv = await testRecruiterToCollegeInvitation(
      tokens.recruiter,
      collegeUser.user._id,
      testJob._id
    );
    console.log('');

    // Step 4: Test Automatic Invitations
    console.log('=== STEP 4: AUTOMATIC INVITATION SYSTEM ===');
    await testAutomaticInvitations(tokens.recruiter);
    console.log('');

    // Step 5: Test Invitation Responses
    console.log('=== STEP 5: INVITATION RESPONSES ===');
    
    // Accept one invitation
    await testInvitationResponse(tokens.recruiter, collegeToRecruiterInv._id, 'accept');
    
    // Decline one invitation  
    await testInvitationResponse(tokens.college, recruiterToCollegeInv._id, 'decline');
    console.log('');

    // Step 6: Test Resend Functionality
    console.log('=== STEP 6: RESEND INVITATION ===');
    await testResendInvitation(tokens.recruiter, collegeToRecruiterInv._id);
    console.log('');

    // Step 7: Get All Invitations
    console.log('=== STEP 7: INVITATION SUMMARY ===');
    const collegeInvitations = await getAllInvitations(tokens.college, 'college');
    const recruiterInvitations = await getAllInvitations(tokens.recruiter, 'recruiter');
    
    console.log(`📊 College has ${collegeInvitations.length} invitations`);
    console.log(`📊 Recruiter has ${recruiterInvitations.length} invitations`);
    console.log('');

    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY! 🎉');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runComprehensiveTest();
}

module.exports = {
  runComprehensiveTest,
  testCredentials
};
