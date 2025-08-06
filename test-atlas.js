const axios = require('axios');

async function testResumeGeneration() {
  try {
    console.log('Testing resume generation with valid user...');
    
    // Use the debug endpoint that doesn't require auth to test saving
    const debugResponse = await axios.post('http://localhost:5001/api/ai-resume/debug-save', {});
    
    console.log('Debug save response:', debugResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testResumeGeneration();
