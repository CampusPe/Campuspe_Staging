const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testCollegeRegistration() {
  try {
    console.log('🧪 Testing College Registration...');
    
    // Test with minimal required data to see validation errors
    const testData = {
      email: 'test@testcollege.edu',
      password: 'testpass123',
      role: 'college',
      userType: 'college',
      phoneNumber: '+918877665544',
      whatsappNumber: '+918877665544',
      profileData: {
        collegeName: 'Test College',
        shortName: 'TC',
        domainCode: 'TC123',
        website: 'https://testcollege.edu',
        establishedYear: 2020,
        affiliation: 'Test University',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India',
        contactName: 'Test Admin',
        contactDesignation: 'Administrator',
        contactEmail: 'admin@testcollege.edu',
        contactPhone: '+918877665544',
        departments: ['Computer Science', 'Engineering'],
        allowDirectApplications: true,
        isPlacementActive: true,
        placementCriteria: {
          minimumCGPA: 6.0,
          allowedBranches: ['CSE', 'IT'],
          noOfBacklogs: 0
        },
        firstName: 'Test',
        lastName: 'Admin'
      }
    };

    console.log('📤 Sending registration data:');
    console.log(JSON.stringify(testData, null, 2));

    const response = await axios.post(`${API_BASE_URL}/auth/register`, testData);
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Registration failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCollegeRegistration();
