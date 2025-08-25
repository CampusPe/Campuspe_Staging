const axios = require('axios');

// Test debug endpoint for MongoDB Atlas fix
async function testDebugEndpoint() {
  try {
    console.log('🧪 Testing MongoDB Atlas Debug Endpoint...\n');

    // Test with minimal data
    const testData = {
      email: 'premthakare@gmail.com',
      jobDescription: 'Software Engineer position requiring React.js and Node.js experience.'
    };

    console.log('🚀 Testing debug-no-auth endpoint...');
    console.log('📝 Test data:', testData);

    const response = await axios.post('http://localhost:5001/api/ai-resume-builder/debug-no-auth', testData);

    if (response.data.success) {
      console.log('\n✅ Debug endpoint responded successfully!');
      console.log('📊 Response data:', response.data);
      
      // Check if the response indicates MongoDB storage
      const responseStr = JSON.stringify(response.data, null, 2);
      
      if (responseStr.includes('generatedResume') || responseStr.includes('GeneratedResume')) {
        console.log('\n🎉 SUCCESS! The response mentions GeneratedResume!');
        console.log('✅ This suggests our MongoDB Atlas fix is working.');
      } else {
        console.log('\n⚠️  The response doesn\'t specifically mention GeneratedResume storage');
        console.log('🔍 But the endpoint is working - this is progress!');
      }

    } else {
      console.log('❌ Debug endpoint failed:', response.data.message);
    }

  } catch (error) {
    console.error('💥 Debug test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Make sure the server is running on http://localhost:5001');
    }
  }
}

// Alternative: Test the save-resume endpoint
async function testSaveResumeEndpoint() {
  try {
    console.log('\n🔄 Testing save-resume endpoint...');

    const testResumeData = {
      studentEmail: 'premthakare26@gmail.com',
      resumeData: {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'premthakare26@gmail.com',
          phone: '+919876543210'
        },
        skills: [
          { name: 'JavaScript', level: 'Advanced', category: 'Technical' },
          { name: 'React.js', level: 'Advanced', category: 'Technical' }
        ],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        languages: []
      },
      jobDescription: 'Test job for MongoDB Atlas storage'
    };

    const response = await axios.post('http://localhost:5001/api/ai-resume-builder/save-resume', testResumeData);

    if (response.data.success) {
      console.log('✅ Save-resume endpoint worked!');
      console.log('📄 Resume ID:', response.data.data?.resumeId);
      console.log('🔗 Download URL:', response.data.data?.downloadUrl);
      
      if (response.data.data?.downloadUrl) {
        console.log('\n🎉 SUCCESS! Resume has a download URL!');
        console.log('✅ This indicates the resume was saved to MongoDB Atlas.');
      }
    } else {
      console.log('❌ Save-resume failed:', response.data.message);
    }

  } catch (error) {
    console.error('💥 Save-resume test failed:', error.response?.data || error.message);
  }
}

// Run both tests
async function runAllTests() {
  await testDebugEndpoint();
  await testSaveResumeEndpoint();
}

runAllTests();
