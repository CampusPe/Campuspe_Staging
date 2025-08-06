const axios = require('axios');

async function testDebugSave() {
  try {
    console.log('Testing debug save endpoint...');
    
    const response = await axios.post('http://localhost:5001/api/ai-resume/debug-save', {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testDebugSave();
