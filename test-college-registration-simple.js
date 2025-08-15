const axios = require('axios');

async function testCollegeRegistrationSimple() {
  try {
    console.log('🧪 Testing College Registration...');
    
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

    const response = await axios.post('http://localhost:5001/api/auth/register', testData, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Registration failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Request error - no response received');
      console.error('Request details:', error.code, error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Wait a bit for server to be ready
setTimeout(testCollegeRegistrationSimple, 2000);
