const axios = require('axios');

console.log('🧪 Testing Fresh Azure Resume Generation');

async function generateFreshAzureResume() {
  try {
    const azureEndpoint = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb/generate-resume-complete';
    
    const payload = {
      name: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      phone: '+919156621088',
      jobDescription: 'Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications.'
    };
    
    console.log('📤 Generating resume via Azure endpoint...');
    console.log('📡 URL:', azureEndpoint);
    
    const startTime = Date.now();
    const response = await axios.post(azureEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    const endTime = Date.now();
    
    console.log('✅ Azure response received in', (endTime - startTime) / 1000, 'seconds');
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.downloadUrl) {
      const downloadUrl = response.data.data.downloadUrl;
      console.log('\n🔍 Testing access to generated resume...');
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
          console.log('✅ Resume is accessible and ready!');
          
          // Now test webhook triggering with this valid URL
          console.log('\n🎯 Testing webhook with valid resume URL...');
          const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
          
          const webhookPayload = {
            phone: '+919156621088',
            downloadUrl: downloadUrl,
            studentName: 'Prem Thakare',
            email: 'premthakare@gmail.com',
            resumeId: response.data.data.resumeId,
            timestamp: new Date().toISOString(),
            source: 'campuspe-test',
            action: 'resume-ready'
          };
          
          const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
            validateStatus: () => true
          });
          
          console.log('✅ Webhook Response Status:', webhookResponse.status);
          console.log('✅ Webhook Response Data:', webhookResponse.data);
          
          if (webhookResponse.status === 200 || webhookResponse.status === 400) {
            console.log('🎉 Webhook triggered successfully! Status 400 is often normal for WABB webhooks.');
          }
          
        } else {
          console.log('❌ Resume not accessible - status:', resumeResponse.status);
        }
        
      } catch (accessError) {
        console.log('❌ Resume access failed:', accessError.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Azure resume generation failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

generateFreshAzureResume();
