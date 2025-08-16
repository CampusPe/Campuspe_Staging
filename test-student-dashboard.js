const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5001';

// Test token - get this from localStorage in your browser's dev tools
const TEST_TOKEN = 'your-token-here'; // Replace with actual JWT token

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testStudentDashboardAPIs() {
  console.log('🧪 Testing Student Dashboard APIs...\n');

  try {
    // Test 1: Student Profile
    console.log('1️⃣ Testing GET /api/students/profile');
    try {
      const profileResponse = await axios.get(`${API_BASE_URL}/api/students/profile`, { headers });
      console.log('✅ Status:', profileResponse.status);
      console.log('📄 Response structure:', {
        hasSuccess: 'success' in profileResponse.data,
        hasData: 'data' in profileResponse.data,
        topLevelKeys: Object.keys(profileResponse.data),
        hasId: profileResponse.data._id ? 'direct' : profileResponse.data.data?._id ? 'nested' : 'missing'
      });
      
      if (profileResponse.data.data) {
        console.log('🎯 Student ID:', profileResponse.data.data._id);
        console.log('👤 Student Name:', profileResponse.data.data.firstName, profileResponse.data.data.lastName);
      } else if (profileResponse.data._id) {
        console.log('🎯 Student ID:', profileResponse.data._id);
        console.log('👤 Student Name:', profileResponse.data.firstName, profileResponse.data.lastName);
      }
    } catch (error) {
      console.log('❌ Profile API failed:', error.response?.status, error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Student Applications
    console.log('2️⃣ Testing GET /api/students/applications');
    try {
      const applicationsResponse = await axios.get(`${API_BASE_URL}/api/students/applications`, { headers });
      console.log('✅ Status:', applicationsResponse.status);
      console.log('📄 Response structure:', {
        hasSuccess: 'success' in applicationsResponse.data,
        hasData: 'data' in applicationsResponse.data,
        isArray: Array.isArray(applicationsResponse.data),
        length: applicationsResponse.data?.length || applicationsResponse.data?.data?.length || 0
      });
    } catch (error) {
      console.log('❌ Applications API failed:', error.response?.status, error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Job Matches
    console.log('3️⃣ Testing job matches endpoints');
    
    // We need student ID first
    let studentId = null;
    try {
      const profileResponse = await axios.get(`${API_BASE_URL}/api/students/profile`, { headers });
      studentId = profileResponse.data.data?._id || profileResponse.data._id;
    } catch (error) {
      console.log('❌ Could not get student ID for job matches test');
      return;
    }

    if (studentId) {
      console.log('🎯 Using Student ID:', studentId);
      
      // Test student-career endpoint
      try {
        const jobMatchesResponse = await axios.get(`${API_BASE_URL}/api/student-career/${studentId}/job-matches?limit=8&threshold=10`, { headers });
        console.log('✅ Student-career job matches status:', jobMatchesResponse.status);
        console.log('📄 Response structure:', {
          hasData: 'data' in jobMatchesResponse.data,
          hasMatches: jobMatchesResponse.data.data?.matches ? jobMatchesResponse.data.data.matches.length : 0
        });
      } catch (error) {
        console.log('❌ Student-career job matches failed:', error.response?.status, error.response?.data || error.message);
      }

      // Test students matches endpoint
      try {
        const studentsMatchesResponse = await axios.get(`${API_BASE_URL}/api/students/${studentId}/matches`, { headers });
        console.log('✅ Students matches status:', studentsMatchesResponse.status);
        console.log('📄 Response structure:', Object.keys(studentsMatchesResponse.data));
      } catch (error) {
        console.log('❌ Students matches failed:', error.response?.status, error.response?.data || error.message);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Interviews
    console.log('4️⃣ Testing GET /api/interviews/student/assignments');
    try {
      const interviewsResponse = await axios.get(`${API_BASE_URL}/api/interviews/student/assignments`, { headers });
      console.log('✅ Status:', interviewsResponse.status);
      console.log('📄 Response structure:', {
        hasData: 'data' in interviewsResponse.data,
        isArray: Array.isArray(interviewsResponse.data),
        length: interviewsResponse.data?.length || interviewsResponse.data?.data?.length || 0
      });
    } catch (error) {
      console.log('❌ Interviews API failed:', error.response?.status, error.response?.data || error.message);
    }

  } catch (error) {
    console.log('💥 Test suite failed:', error.message);
  }
}

// Check if token is provided
if (TEST_TOKEN === 'your-token-here') {
  console.log('❌ Please update TEST_TOKEN with your actual JWT token');
  console.log('📝 You can get this from your browser\'s localStorage when logged in');
  console.log('💡 Or run: localStorage.getItem("token") in browser console');
  process.exit(1);
}

testStudentDashboardAPIs();
