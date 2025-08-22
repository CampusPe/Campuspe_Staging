const axios = require('axios');

console.log('🔍 Debugging Current Azure WABB Endpoint Issues');

async function debugCurrentIssues() {
  try {
    console.log('\n🧪 Testing Azure WABB endpoint with detailed logging...');
    
    const azureEndpoint = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb/generate-resume-complete';
    
    const payload = {
      name: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      phone: '+919156621088',
      jobDescription: 'Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications.'
    };
    
    console.log('📤 Sending request to:', azureEndpoint);
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    
    const startTime = Date.now();
    const response = await axios.post(azureEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    const endTime = Date.now();
    
    console.log('\n✅ Response received in', (endTime - startTime) / 1000, 'seconds');
    console.log('📊 Status Code:', response.status);
    console.log('📋 Full Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.downloadUrl) {
      const downloadUrl = response.data.data.downloadUrl;
      console.log('\n🔍 Testing resume file access...');
      console.log('📄 Download URL:', downloadUrl);
      
      try {
        const fileResponse = await axios.head(downloadUrl, { timeout: 10000 });
        console.log('✅ File accessible - Status:', fileResponse.status);
        console.log('📄 Content-Type:', fileResponse.headers['content-type']);
        console.log('📄 Content-Length:', fileResponse.headers['content-length']);
        
        // Test downloading a small portion to verify it's a valid PDF
        const partialResponse = await axios.get(downloadUrl, {
          headers: { 'Range': 'bytes=0-1023' },
          timeout: 10000,
          responseType: 'arraybuffer'
        });
        
        const pdfHeader = Buffer.from(partialResponse.data).toString('ascii', 0, 4);
        console.log('📄 PDF Header:', pdfHeader);
        
        if (pdfHeader === '%PDF') {
          console.log('✅ Valid PDF file confirmed');
        } else {
          console.log('❌ Invalid PDF file - header:', pdfHeader);
        }
        
      } catch (fileError) {
        console.log('❌ File access failed:', fileError.message);
      }
      
      // Check WhatsApp sent status
      console.log('\n📱 WhatsApp Status Analysis:');
      console.log('   whatsappSent:', response.data.data.whatsappSent);
      console.log('   formattedPhone:', response.data.data.formattedPhone);
      
      if (!response.data.data.whatsappSent) {
        console.log('⚠️  WhatsApp not sent - this could be due to:');
        console.log('     1. WABB configuration issue');
        console.log('     2. Phone number format issue');
        console.log('     3. Service timeout or error');
        
        // Test webhook manually
        console.log('\n🎯 Testing webhook manually...');
        const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
        
        const webhookPayload = {
          phone: response.data.data.formattedPhone,
          downloadUrl: downloadUrl,
          studentName: response.data.data.studentName,
          email: response.data.data.email,
          resumeId: response.data.data.resumeId,
          timestamp: new Date().toISOString(),
          source: 'manual-debug-test',
          action: 'resume-ready'
        };
        
        try {
          const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
            validateStatus: () => true
          });
          
          console.log('📤 Manual webhook test - Status:', webhookResponse.status);
          console.log('📤 Manual webhook test - Response:', webhookResponse.data || 'No data');
          
        } catch (webhookError) {
          console.log('❌ Manual webhook test failed:', webhookError.message);
        }
      } else {
        console.log('✅ WhatsApp was sent successfully');
      }
      
    } else {
      console.log('❌ Resume generation failed or no download URL');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

debugCurrentIssues();
