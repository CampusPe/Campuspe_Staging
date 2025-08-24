#!/usr/bin/env node

/**
 * Comprehensive Debug Script for AI Resume Builder Issues
 * Tests both localhost and Azure deployment
 */

const axios = require('axios');
const fs = require('fs');

// Test configurations
const LOCALHOST_API = 'http://localhost:5001';
const AZURE_API = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net';

// Sample data for testing
const testJobDescription = `
Senior Full Stack Developer Position

We are looking for an experienced Full Stack Developer to join our growing team. 

Key Responsibilities:
- Develop and maintain web applications using React, Node.js, and MongoDB
- Collaborate with cross-functional teams to deliver high-quality software
- Write clean, maintainable, and well-documented code
- Participate in code reviews and technical discussions

Required Skills:
- 3+ years of experience in JavaScript/TypeScript
- Experience with React.js and Node.js
- Knowledge of MongoDB and database design
- Understanding of RESTful APIs
- Experience with Git version control

Preferred Skills:
- Experience with cloud platforms (AWS, Azure)
- Knowledge of Docker and containerization
- Familiarity with CI/CD pipelines
- Experience with testing frameworks

Location: San Francisco, CA (Remote friendly)
Salary: $100,000 - $130,000
`;

const testCredentials = {
  email: 'test.developer@example.com',
  phone: '9876543210',
  jobDescription: testJobDescription.trim()
};

/**
 * Test API health and connectivity
 */
async function testAPIHealth(baseUrl, name) {
  console.log(`\n🏥 Testing ${name} API Health...`);
  
  try {
    // Test basic connectivity
    const response = await axios.get(`${baseUrl}/api/health/pdf`, {
      timeout: 10000
    });
    
    console.log(`✅ ${name} API Health:`, response.data);
    return true;
  } catch (error) {
    console.error(`❌ ${name} API Health Failed:`, error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return false;
  }
}

/**
 * Test Azure PDF Service availability
 */
async function testAzurePDFService() {
  console.log('\n🔧 Testing Azure PDF Service...');
  
  const azurePdfUrls = [
    'http://campuspe-pdf-service.southindia.azurecontainer.io:3000',
    'https://campuspe-pdf-service.southindia.azurecontainer.io:3000'
  ];
  
  for (const url of azurePdfUrls) {
    try {
      console.log(`Testing PDF service at: ${url}`);
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      console.log(`✅ Azure PDF Service available at ${url}:`, response.data);
      return true;
    } catch (error) {
      console.error(`❌ PDF Service failed at ${url}:`, error.message);
    }
  }
  
  console.error('❌ Azure PDF Service is completely unavailable');
  return false;
}

/**
 * Test resume generation without authentication
 */
async function testResumeGeneration(baseUrl, name) {
  console.log(`\n📄 Testing ${name} Resume Generation...`);
  
  try {
    // Try the test endpoint first (no auth required)
    const response = await axios.post(`${baseUrl}/api/ai-resume-builder/test-generate`, testCredentials, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${name} Resume Generation Response:`, {
      success: response.data.success,
      message: response.data.message,
      hasResumeId: !!response.data.data?.resumeId,
      resumeId: response.data.data?.resumeId,
      downloadUrl: response.data.data?.downloadUrl,
      pdfSize: response.data.data?.pdfSize
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ ${name} Resume Generation Failed:`, error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    return null;
  }
}

/**
 * Test PDF download
 */
async function testPDFDownload(baseUrl, name, resumeId) {
  if (!resumeId) {
    console.log(`⚠️ Skipping ${name} PDF download - no resume ID`);
    return;
  }
  
  console.log(`\n📥 Testing ${name} PDF Download...`);
  
  try {
    const downloadUrl = `${baseUrl}/api/generated-resume/download-public/${resumeId}`;
    console.log('Download URL:', downloadUrl);
    
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    const pdfSize = response.data.byteLength;
    console.log(`✅ ${name} PDF Downloaded successfully:`, {
      size: pdfSize,
      type: response.headers['content-type'],
      disposition: response.headers['content-disposition']
    });
    
    // Save PDF for inspection
    const fileName = `test-${name.toLowerCase().replace(' ', '-')}-resume-${Date.now()}.pdf`;
    fs.writeFileSync(fileName, response.data);
    console.log(`💾 PDF saved as: ${fileName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ ${name} PDF Download Failed:`, error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    
    return false;
  }
}

/**
 * Test resume history endpoint (requires auth)
 */
async function testResumeHistory(baseUrl, name) {
  console.log(`\n📋 Testing ${name} Resume History (no auth)...`);
  
  try {
    const response = await axios.get(`${baseUrl}/api/generated-resume/history`, {
      timeout: 10000
    });
    
    console.log(`✅ ${name} Resume History:`, response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ ${name} Resume History correctly requires authentication`);
    } else {
      console.error(`❌ ${name} Resume History Error:`, error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }
  }
}

/**
 * Test WABB resume generation
 */
async function testWABBGeneration(baseUrl, name) {
  console.log(`\n🤖 Testing ${name} WABB Resume Generation...`);
  
  try {
    const response = await axios.post(`${baseUrl}/api/wabb/create-resume`, {
      email: testCredentials.email,
      phone: testCredentials.phone,
      jobDescription: testCredentials.jobDescription
    }, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${name} WABB Generation:`, {
      success: response.data.success,
      message: response.data.message,
      resumeId: response.data.resumeId
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ ${name} WABB Generation Failed:`, error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    return null;
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🚀 Starting Comprehensive AI Resume Builder Debug Tests...');
  console.log('=' .repeat(80));
  
  // Test 1: API Health
  const localhostHealthy = await testAPIHealth(LOCALHOST_API, 'Localhost');
  const azureHealthy = await testAPIHealth(AZURE_API, 'Azure');
  
  // Test 2: Azure PDF Service
  await testAzurePDFService();
  
  // Test 3: Resume Generation
  let localhostResult = null;
  let azureResult = null;
  
  if (localhostHealthy) {
    localhostResult = await testResumeGeneration(LOCALHOST_API, 'Localhost');
  }
  
  if (azureHealthy) {
    azureResult = await testResumeGeneration(AZURE_API, 'Azure');
  }
  
  // Test 4: PDF Downloads
  if (localhostResult?.data?.resumeId) {
    await testPDFDownload(LOCALHOST_API, 'Localhost', localhostResult.data.resumeId);
  }
  
  if (azureResult?.data?.resumeId) {
    await testPDFDownload(AZURE_API, 'Azure', azureResult.data.resumeId);
  }
  
  // Test 5: Resume History
  await testResumeHistory(LOCALHOST_API, 'Localhost');
  await testResumeHistory(AZURE_API, 'Azure');
  
  // Test 6: WABB Generation
  if (localhostHealthy) {
    await testWABBGeneration(LOCALHOST_API, 'Localhost');
  }
  
  if (azureHealthy) {
    await testWABBGeneration(AZURE_API, 'Azure');
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('🏁 Tests Complete!');
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`- Localhost API Health: ${localhostHealthy ? '✅' : '❌'}`);
  console.log(`- Azure API Health: ${azureHealthy ? '✅' : '❌'}`);
  console.log(`- Resume Generation Working: ${(localhostResult || azureResult) ? '✅' : '❌'}`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (!azureHealthy) {
    console.log('❌ Azure API is not responding to health checks');
  }
  
  if (!localhostResult && !azureResult) {
    console.log('❌ Resume generation is failing on both environments');
  }
  
  console.log('✅ Next: Check browser network tab and authentication status');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
