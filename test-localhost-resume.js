const axios = require('axios');

console.log('🧪 Testing Localhost Resume Generation and File Access');

async function testLocalhostResume() {
  try {
    const localhostEndpoint = 'http://localhost:5001/api/wabb/generate-resume-complete';
    
    const payload = {
      name: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      phone: '+919156621088',
      jobDescription: 'Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications.'
    };
    
    console.log('📤 Generating resume via localhost...');
    console.log('📡 URL:', localhostEndpoint);
    
    const startTime = Date.now();
    const response = await axios.post(localhostEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    const endTime = Date.now();
    
    console.log('✅ Localhost response received in', (endTime - startTime) / 1000, 'seconds');
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.downloadUrl) {
      const downloadUrl = response.data.data.downloadUrl;
      console.log('\n🔍 Testing access to localhost-generated resume...');
      console.log('📄 Download URL:', downloadUrl);
      
      // Test access to the resume
      try {
        const resumeResponse = await axios.get(downloadUrl, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        console.log('📄 Resume Access Status:', resumeResponse.status);
        console.log('📄 Content-Type:', resumeResponse.headers['content-type']);
        console.log('📄 Content-Length:', resumeResponse.headers['content-length']);
        
        if (resumeResponse.status === 200) {
          console.log('✅ Localhost resume is accessible!');
          console.log('📄 This confirms localhost file serving works correctly');
        } else {
          console.log('❌ Localhost resume not accessible - status:', resumeResponse.status);
        }
        
      } catch (accessError) {
        console.log('❌ Localhost resume access failed:', accessError.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Localhost resume generation failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testLocalhostResume();
