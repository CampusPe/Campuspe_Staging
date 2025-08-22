const axios = require('axios');

console.log('🔍 Testing Azure Environment Variables and AI Processing');

async function testAzureEnvironment() {
  try {
    console.log('\n🧪 Testing Azure endpoint with debug information...');
    
    const azureEndpoint = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb/generate-resume-complete';
    
    const payload = {
      name: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      phone: '+919156621088',
      jobDescription: 'DETAILED JOB DESCRIPTION: Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications. Key responsibilities include: developing user-friendly interfaces, optimizing database performance, implementing CI/CD pipelines, mentoring junior developers, and architecting scalable solutions.'
    };
    
    console.log('📤 Sending request with longer job description...');
    
    const startTime = Date.now();
    const response = await axios.post(azureEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    const endTime = Date.now();
    
    console.log('✅ Response received in', (endTime - startTime) / 1000, 'seconds');
    console.log('📋 Resume Data:');
    console.log('   Student Name:', response.data.data.studentName);
    console.log('   Email:', response.data.data.email);
    console.log('   Phone:', response.data.data.formattedPhone);
    console.log('   Resume ID:', response.data.data.resumeId);
    console.log('   File Name:', response.data.data.fileName);
    console.log('   WhatsApp Sent:', response.data.data.whatsappSent);
    
    const downloadUrl = response.data.data.downloadUrl;
    console.log('\n📄 File Analysis:');
    console.log('   Download URL:', downloadUrl);
    
    // Check file details
    const fileResponse = await axios.head(downloadUrl);
    const fileSize = parseInt(fileResponse.headers['content-length'] || '0');
    console.log('   File Size:', fileSize, 'bytes');
    
    if (fileSize < 5000) {
      console.log('🚨 CRITICAL: File size is very small, indicating poor AI processing');
      console.log('   This suggests missing Claude API key or AI service failure');
    } else if (fileSize > 50000) {
      console.log('✅ File size indicates good AI processing');
    } else {
      console.log('⚠️ File size is moderate, may have partial AI processing');
    }
    
    // Test actual download to verify content
    console.log('\n🔍 Testing actual file download...');
    try {
      const fileDownload = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        headers: { 'Range': 'bytes=0-2047' }, // First 2KB
        timeout: 10000
      });
      
      const pdfContent = Buffer.from(fileDownload.data).toString('ascii');
      console.log('📄 PDF Content Preview (first 200 chars):');
      console.log(pdfContent.substring(0, 200));
      
      // Check if it contains meaningful content
      if (pdfContent.includes('React') || pdfContent.includes('Node.js') || pdfContent.includes('TypeScript')) {
        console.log('✅ PDF contains expected job-related content');
      } else {
        console.log('⚠️ PDF may not contain expected job-related content');
      }
      
    } catch (downloadError) {
      console.log('❌ File download failed:', downloadError.message);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testAzureEnvironment();
