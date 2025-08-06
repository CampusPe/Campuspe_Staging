const axios = require('axios');

async function testResumeGeneration() {
  try {
    console.log('Testing AI Resume Generation...');
    
    // Try to login with existing user credentials
    console.log('Attempting to login with existing user...');
    
    // First let's try a simple GET request to check if the endpoint exists
    try {
      const healthCheck = await axios.get('http://localhost:5001/health');
      console.log('Health check status:', healthCheck.status);
    } catch (error) {
      console.log('Health check failed:', error.message);
    }

    // Let's try the login endpoint
    let token = null;
    try {
      const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
        email: 'ankita@gmail.com',
        password: 'ankita123'
      });
      
      if (loginResponse.data && loginResponse.data.token) {
        token = loginResponse.data.token;
        console.log('✅ User logged in successfully');
      }
    } catch (loginError) {
      console.log('Login failed:', loginError.response?.data || loginError.message);
    }

    if (!token) {
      console.log('❌ Could not get authentication token, trying without auth');
      
      // Let's check what routes are available
      try {
        const routeCheck = await axios.get('http://localhost:5001/api/ai-resume');
        console.log('Route check:', routeCheck.status);
      } catch (routeError) {
        console.log('Route check error:', routeError.response?.status, routeError.response?.data);
      }
      return;
    }
    
    // Now test the resume generation
    console.log('Generating AI resume...');
    const response = await axios.post('http://localhost:5001/api/ai-resume/generate-ai', {
      email: 'ankita@gmail.com',
      phone: '9876543210',
      jobDescription: 'Looking for a skilled Node.js developer with experience in MongoDB and React. Should have strong problem-solving skills and experience with cloud platforms.',
      includeProfileData: true
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response Status:', response.status);
    
    if (response.data && response.data.success) {
      console.log('✅ Resume generated successfully!');
      console.log('PDF URL:', response.data.pdfUrl);
      console.log('Resume saved to history:', response.data.historySaved);
    } else {
      console.log('❌ Resume generation failed');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('Error testing resume generation:', error.response.status, error.response.data);
    } else {
      console.error('Error testing resume generation:', error.message);
    }
  }
}

testResumeGeneration();
