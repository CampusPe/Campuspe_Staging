const axios = require('axios');

console.log('🔍 COMPREHENSIVE DIAGNOSIS - WABB Resume Generation Issues');

async function diagnoseIssues() {
  console.log('\n==================================================');
  console.log('🧪 TESTING LOCALHOST ENVIRONMENT');
  console.log('==================================================');
  
  try {
    const localhostEndpoint = 'http://localhost:5001/api/wabb/generate-resume-complete';
    
    console.log('📋 Testing localhost with detailed payload...');
    const payload = {
      name: 'Prem Thakare',
      email: 'premthakare@gmail.com', 
      phone: '+919156621088',
      jobDescription: `Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. 

Key Responsibilities:
- Lead development teams in building scalable web applications
- Architect microservices using Node.js and Express
- Implement responsive UI components with React and TypeScript
- Design and optimize MongoDB database schemas
- Collaborate with cross-functional teams on product roadmap

Technical Skills:
- Frontend: React, TypeScript, Next.js, Tailwind CSS
- Backend: Node.js, Express, RESTful APIs, GraphQL
- Database: MongoDB, PostgreSQL, Redis
- Cloud: AWS, Azure, Docker, Kubernetes
- Tools: Git, Jenkins, Jest, Webpack

Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications.`
    };
    
    const startTime = Date.now();
    const response = await axios.post(localhostEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    const endTime = Date.now();
    
    console.log('✅ Localhost Generation: SUCCESS');
    console.log('⏱️  Time:', (endTime - startTime) / 1000, 'seconds');
    console.log('📄 Download URL:', response.data.data.downloadUrl);
    console.log('📊 File Info:', {
      resumeId: response.data.data.resumeId,
      fileName: response.data.data.fileName,
      formattedPhone: response.data.data.formattedPhone,
      whatsappSent: response.data.data.whatsappSent
    });
    
    // Test file access and size
    const fileResponse = await axios.head(response.data.data.downloadUrl);
    console.log('📄 File Details:', {
      status: fileResponse.status,
      contentType: fileResponse.headers['content-type'],
      contentLength: fileResponse.headers['content-length'],
      sizeKB: Math.round(parseInt(fileResponse.headers['content-length']) / 1024)
    });
    
  } catch (error) {
    console.log('❌ Localhost test failed:', error.message);
  }
  
  console.log('\n==================================================');
  console.log('🌐 TESTING AZURE PRODUCTION ENVIRONMENT');
  console.log('==================================================');
  
  try {
    const azureEndpoint = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb/generate-resume-complete';
    
    console.log('📋 Testing Azure with same detailed payload...');
    const payload = {
      name: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      phone: '+919156621088', 
      jobDescription: `Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. 

Key Responsibilities:
- Lead development teams in building scalable web applications
- Architect microservices using Node.js and Express
- Implement responsive UI components with React and TypeScript
- Design and optimize MongoDB database schemas
- Collaborate with cross-functional teams on product roadmap

Technical Skills:
- Frontend: React, TypeScript, Next.js, Tailwind CSS
- Backend: Node.js, Express, RESTful APIs, GraphQL
- Database: MongoDB, PostgreSQL, Redis
- Cloud: AWS, Azure, Docker, Kubernetes
- Tools: Git, Jenkins, Jest, Webpack

Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications.`
    };
    
    const startTime = Date.now();
    const response = await axios.post(azureEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    const endTime = Date.now();
    
    console.log('✅ Azure Generation: SUCCESS');
    console.log('⏱️  Time:', (endTime - startTime) / 1000, 'seconds'); 
    console.log('📄 Download URL:', response.data.data.downloadUrl);
    console.log('📊 File Info:', {
      resumeId: response.data.data.resumeId,
      fileName: response.data.data.fileName,
      formattedPhone: response.data.data.formattedPhone,
      whatsappSent: response.data.data.whatsappSent
    });
    
    // Test file access and size
    const fileResponse = await axios.head(response.data.data.downloadUrl);
    console.log('📄 File Details:', {
      status: fileResponse.status,
      contentType: fileResponse.headers['content-type'],
      contentLength: fileResponse.headers['content-length'],
      sizeKB: Math.round(parseInt(fileResponse.headers['content-length']) / 1024)
    });
    
    // Test webhook
    console.log('\n🎯 Testing webhook integration...');
    const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
    
    const webhookPayload = {
      phone: '+919156621088',
      downloadUrl: response.data.data.downloadUrl,
      studentName: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      resumeId: response.data.data.resumeId,
      timestamp: new Date().toISOString(),
      source: 'campuspe-diagnosis',
      action: 'resume-ready'
    };
    
    const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log('✅ Webhook Response:', {
      status: webhookResponse.status,
      success: webhookResponse.status === 200 || webhookResponse.status === 400
    });
    
  } catch (error) {
    console.log('❌ Azure test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
  
  console.log('\n==================================================');
  console.log('🔍 DIAGNOSIS SUMMARY');
  console.log('==================================================');
  console.log('');
  console.log('📋 Expected Issues Based on Analysis:');
  console.log('   1. Azure resume file size significantly smaller than localhost');
  console.log('   2. Azure missing Claude API key (CLAUDE_API_KEY or ANTHROPIC_API_KEY)');
  console.log('   3. WhatsApp integration shows whatsappSent: false');
  console.log('   4. Resume quality degraded due to fallback generation');
  console.log('');
  console.log('🛠️  Required Fixes:');
  console.log('   1. Add CLAUDE_API_KEY to Azure environment variables');
  console.log('   2. Fix WhatsApp message sending logic');
  console.log('   3. Ensure consistent AI processing between environments');
}

diagnoseIssues();
