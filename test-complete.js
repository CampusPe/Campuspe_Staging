const axios = require('axios');

async function testResumeGeneration() {
  try {
    console.log('Testing enhanced resume generation and history saving...');
    
    // Test with an existing user that we know exists in the database
    // Let's use the debug endpoint first to see if any users exist
    
    console.log('1. Testing debug save endpoint...');
    const debugResponse = await axios.post('http://localhost:5001/api/ai-resume/debug-save', {});
    console.log('Debug response:', debugResponse.data);
    
    console.log('\n2. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('Health status:', healthResponse.status);
    
    // Try to register a new test user
    console.log('\n3. Attempting to register test user...');
    try {
      const registerResponse = await axios.post('http://localhost:5001/api/auth/register', {
        email: 'testuser2@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        phoneNumber: '9876543210'
      });
      console.log('Registration successful:', registerResponse.data);
    } catch (regError) {
      console.log('Registration failed (might already exist):', regError.response?.data?.message);
    }
    
    // Try to login
    console.log('\n4. Attempting login...');
    let token = null;
    try {
      const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
        email: 'testuser2@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.token) {
        token = loginResponse.data.token;
        console.log('✅ Login successful, got token');
      }
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data?.message);
      
      // Try with a different user
      try {
        const altLoginResponse = await axios.post('http://localhost:5001/api/auth/login', {
          email: 'ankita@gmail.com',
          password: 'ankita123'
        });
        
        if (altLoginResponse.data.token) {
          token = altLoginResponse.data.token;
          console.log('✅ Alternative login successful');
        }
      } catch (altError) {
        console.log('❌ Alternative login also failed:', altError.response?.data?.message);
      }
    }
    
    if (token) {
      console.log('\n5. Testing AI resume generation...');
      const resumeResponse = await axios.post('http://localhost:5001/api/ai-resume/generate-ai', {
        email: 'testuser2@example.com',
        phone: '9876543210',
        jobDescription: 'Looking for a skilled Node.js developer with experience in MongoDB, Express.js, and React. The candidate should have strong problem-solving skills and experience with cloud platforms like AWS or Azure.',
        includeProfileData: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resume generation response:');
      console.log('- Success:', resumeResponse.data.success);
      console.log('- Message:', resumeResponse.data.message);
      console.log('- History saved:', resumeResponse.data.historySaved);
      console.log('- History error:', resumeResponse.data.historyError);
      
      if (resumeResponse.data.data?.resume) {
        console.log('- Resume generated with fields:', Object.keys(resumeResponse.data.data.resume));
      }
      
      // Test history retrieval
      console.log('\n6. Testing history retrieval...');
      const historyResponse = await axios.get('http://localhost:5001/api/ai-resume/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('History response:');
      console.log('- Success:', historyResponse.data.success);
      if (historyResponse.data.data?.resumeHistory) {
        console.log('- History count:', historyResponse.data.data.resumeHistory.length);
        console.log('- History items:', historyResponse.data.data.resumeHistory.map(item => ({
          id: item.id,
          jobTitle: item.jobTitle,
          generatedAt: item.generatedAt
        })));
      }
      
    } else {
      console.log('❌ Could not authenticate - skipping resume generation test');
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testResumeGeneration();
