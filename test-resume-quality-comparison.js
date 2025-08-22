const axios = require('axios');

console.log('🔍 Comparing Resume Quality: Localhost vs Azure');

async function compareResumeQuality() {
  const payload = {
    name: 'Prem Thakare',
    email: 'premthakare@gmail.com',
    phone: '+919156621088',
    jobDescription: 'Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications.'
  };

  console.log('\n==================================================');
  console.log('🏠 TESTING LOCALHOST RESUME QUALITY');
  console.log('==================================================');
  
  try {
    const localhostEndpoint = 'http://localhost:5001/api/wabb/generate-resume-complete';
    
    const startTime = Date.now();
    const response = await axios.post(localhostEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    const endTime = Date.now();
    
    console.log('✅ Localhost Generation Time:', (endTime - startTime) / 1000, 'seconds');
    console.log('📄 Download URL:', response.data.data.downloadUrl);
    
    // Check file size
    const fileResponse = await axios.head(response.data.data.downloadUrl);
    console.log('📄 File Size:', fileResponse.headers['content-length'], 'bytes');
    console.log('📱 WhatsApp Sent:', response.data.data.whatsappSent);
    
  } catch (error) {
    console.log('❌ Localhost test failed:', error.message);
  }

  console.log('\n==================================================');
  console.log('☁️  TESTING AZURE RESUME QUALITY');
  console.log('==================================================');
  
  try {
    const azureEndpoint = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb/generate-resume-complete';
    
    const startTime = Date.now();
    const response = await axios.post(azureEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    const endTime = Date.now();
    
    console.log('✅ Azure Generation Time:', (endTime - startTime) / 1000, 'seconds');
    console.log('📄 Download URL:', response.data.data.downloadUrl);
    
    // Check file size
    const fileResponse = await axios.head(response.data.data.downloadUrl);
    console.log('📄 File Size:', fileResponse.headers['content-length'], 'bytes');
    console.log('📱 WhatsApp Sent:', response.data.data.whatsappSent);
    
  } catch (error) {
    console.log('❌ Azure test failed:', error.message);
  }
  
  console.log('\n==================================================');
  console.log('📊 COMPARISON ANALYSIS');
  console.log('==================================================');
  console.log('If both environments have different file sizes,');
  console.log('it indicates different AI processing or PDF generation.');
  console.log('');
  console.log('If Azure WhatsApp is false but localhost is true,');
  console.log('it indicates Azure environment configuration issues.');
}

compareResumeQuality();
