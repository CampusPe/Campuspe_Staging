const axios = require('axios');
const fs = require('fs');

const API_URL = process.env.API_URL || 'http://localhost:5001'; // Using port 3001 for the API server
async function getAuthToken() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'TestPass123!'
    });
    return response.data.token;
  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message);
    throw error;
  }
}

const TEST_RESUME_DATA = {
  personalInfo: {
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: "123-456-7890",
    linkedin: "linkedin.com/in/testuser",
    github: "github.com/testuser",
    profession: "Software Engineer"
  },
  summary: "Experienced software engineer with focus on full-stack development",
  education: [{
    degree: "Bachelor of Science",
    field: "Computer Science",
    institution: "Test University",
    startDate: new Date("2018-09-01"),
    endDate: new Date("2022-05-01"),
    gpa: 3.8,
    isCompleted: true
  }],
  experience: [{
    title: "Software Engineer",
    company: "Test Corp",
    location: "San Francisco, CA",
    startDate: new Date("2022-06-01"),
    endDate: null,
    description: "Leading full-stack development projects",
    isCurrentJob: true
  }],
  skills: [{
    name: "JavaScript",
    level: "Expert",
    category: "Programming Languages"
  }]
};

async function testResumeGeneration() {
    // Get auth token first
    const token = await getAuthToken();
  try {
    console.log('Testing resume generation with database integration...');
    
    const response = await axios.post(`${API_URL}/api/resume/generate`, 
      {
        resumeData: TEST_RESUME_DATA,
        jobDescription: "Looking for a skilled software engineer..."
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

    console.log('Resume generation response:', response.data);

    if (response.data.pdfUrl) {
      console.log('PDF URL generated:', response.data.pdfUrl);
    }

    if (response.data._id) {
      console.log('Resume saved to database with ID:', response.data._id);
      
      // Verify database entry
      const verifyResponse = await axios.get(`${API_URL}/api/resume/${response.data._id}`);
      console.log('Database verification:', verifyResponse.data);
    }

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testResumeGeneration();
