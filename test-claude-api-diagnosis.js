const axios = require('axios');

console.log('🔍 DEBUGGING AZURE CLAUDE AI ISSUE');

async function testAzureClaudeAPI() {
  try {
    // Test Azure production endpoint with debugging
    const azureEndpoint = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb/generate-resume-complete';
    
    const payload = {
      name: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      phone: '+919156621088',
      jobDescription: 'Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications.'
    };
    
    console.log('📤 Testing Azure with debug payload...');
    
    const response = await axios.post(azureEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    
    console.log('📊 Azure Response Status:', response.status);
    console.log('📋 Azure Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const downloadUrl = response.data.data.downloadUrl;
      console.log('\n🔍 File Size Check...');
      
      try {
        const fileResponse = await axios.head(downloadUrl);
        console.log('📄 Content-Length:', fileResponse.headers['content-length']);
        console.log('📄 Content-Type:', fileResponse.headers['content-type']);
        
        const sizeKB = parseInt(fileResponse.headers['content-length']) / 1024;
        console.log('📄 File Size:', sizeKB.toFixed(2), 'KB');
        
        if (sizeKB < 10) {
          console.log('❌ VERY SMALL FILE - Likely fallback generation was used');
          console.log('🔍 This means Claude AI call failed in Azure');
        } else if (sizeKB > 100) {
          console.log('✅ LARGE FILE - AI generation working properly');
        } else {
          console.log('⚠️ MEDIUM FILE - Unclear if AI or fallback');
        }
        
      } catch (headError) {
        console.log('❌ Could not check file size:', headError.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

async function testLocalhostForComparison() {
  try {
    console.log('\n🏠 TESTING LOCALHOST FOR COMPARISON');
    
    const localhostEndpoint = 'http://localhost:5001/api/wabb/generate-resume-complete';
    
    const payload = {
      name: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      phone: '+919156621088',
      jobDescription: 'Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications.'
    };
    
    const response = await axios.post(localhostEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    
    console.log('📊 Localhost Response Status:', response.status);
    
    if (response.data.success) {
      const downloadUrl = response.data.data.downloadUrl;
      
      try {
        const fileResponse = await axios.head(downloadUrl);
        const sizeKB = parseInt(fileResponse.headers['content-length']) / 1024;
        console.log('📄 Localhost File Size:', sizeKB.toFixed(2), 'KB');
        
        if (sizeKB > 100) {
          console.log('✅ Localhost AI generation working properly');
        } else {
          console.log('❌ Localhost also having issues');
        }
        
      } catch (headError) {
        console.log('❌ Could not check localhost file size');
      }
    }
    
  } catch (error) {
    console.log('❌ Localhost test failed:', error.message);
  }
}

async function runDiagnostics() {
  await testAzureClaudeAPI();
  await testLocalhostForComparison();
  
  console.log('\n📋 DIAGNOSIS SUMMARY:');
  console.log('1. If Azure file is < 10KB: Claude AI key missing/invalid in Azure');
  console.log('2. If Localhost file is > 100KB: Localhost has working Claude API');
  console.log('3. Solution: Add valid CLAUDE_API_KEY to Azure environment variables');
}

runDiagnostics();
