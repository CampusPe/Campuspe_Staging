#!/usr/bin/env node

/**
 * Test Playwright PDF Service Integration
 * Tests the new Playwright service deployment and integration with the main API
 */

const axios = require('axios');

const PLAYWRIGHT_SERVICE_URL = 'https://campuspe-playwright-pdf.azurewebsites.net';
const API_BASE_URL = 'https://api.campuspe.live'; // Your main API

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

async function testPlaywrightService() {
  log('blue', '🧪 Testing Playwright PDF Service...');
  
  try {
    // Test health endpoint
    log('blue', 'Testing health endpoint...');
    const healthResponse = await axios.get(`${PLAYWRIGHT_SERVICE_URL}/health`, { timeout: 10000 });
    
    if (healthResponse.status === 200) {
      log('green', '✅ Health check passed');
      console.log('   Service info:', JSON.stringify(healthResponse.data, null, 2));
    } else {
      log('red', '❌ Health check failed');
      return false;
    }
    
    // Test PDF generation with simple HTML
    log('blue', 'Testing PDF generation...');
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Resume</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            .section { margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>John Doe</h1>
            <p>Software Engineer | john.doe@email.com | (555) 123-4567</p>
          </div>
          <div class="section">
            <h2>Experience</h2>
            <h3>Senior Software Engineer - Tech Company (2020-Present)</h3>
            <ul>
              <li>Developed and maintained web applications</li>
              <li>Led a team of 5 developers</li>
              <li>Improved system performance by 40%</li>
            </ul>
          </div>
          <div class="section">
            <h2>Skills</h2>
            <p>JavaScript, TypeScript, React, Node.js, Azure, AWS</p>
          </div>
        </body>
      </html>
    `;
    
    const pdfRequest = {
      html: testHtml,
      options: {
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        printBackground: true
      }
    };
    
    const pdfResponse = await axios.post(`${PLAYWRIGHT_SERVICE_URL}/generate-pdf`, pdfRequest, {
      timeout: 30000,
      responseType: 'arraybuffer'
    });
    
    if (pdfResponse.status === 200 && pdfResponse.data.byteLength > 1000) {
      log('green', `✅ PDF generation successful (${pdfResponse.data.byteLength} bytes)`);
      
      // Save test PDF for verification
      const fs = require('fs');
      fs.writeFileSync('test-playwright-pdf.pdf', pdfResponse.data);
      log('blue', '📄 Test PDF saved as test-playwright-pdf.pdf');
      
      return true;
    } else {
      log('red', '❌ PDF generation failed or returned empty content');
      return false;
    }
    
  } catch (error) {
    log('red', `❌ Playwright service test failed: ${error.message}`);
    if (error.response) {
      log('red', `   Status: ${error.response.status}`);
      log('red', `   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testAPIIntegration() {
  log('blue', '🔗 Testing API Integration...');
  
  try {
    // Test API health
    log('blue', 'Testing main API health...');
    const apiHealthResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 10000 });
    
    if (apiHealthResponse.status === 200) {
      log('green', '✅ Main API is healthy');
    } else {
      log('yellow', '⚠️ Main API health check returned non-200 status');
    }
    
    // Test AI Resume Builder endpoint
    log('blue', 'Testing AI Resume Builder...');
    const resumeRequest = {
      user_id: 'test-user-playwright',
      name: 'Test User',
      email: 'test@example.com',
      experience: '3 years',
      skills: 'JavaScript, Node.js, React',
      education: 'Bachelor of Computer Science',
      jobDescription: 'Software Engineer position requiring full-stack development skills'
    };
    
    const resumeResponse = await axios.post(`${API_BASE_URL}/ai-resume-builder`, resumeRequest, {
      timeout: 60000
    });
    
    if (resumeResponse.status === 200 && resumeResponse.data.pdfUrl) {
      log('green', '✅ AI Resume Builder working');
      log('blue', `   Generated PDF URL: ${resumeResponse.data.pdfUrl}`);
      return true;
    } else {
      log('red', '❌ AI Resume Builder failed or returned no PDF URL');
      console.log('Response:', JSON.stringify(resumeResponse.data, null, 2));
      return false;
    }
    
  } catch (error) {
    log('red', `❌ API integration test failed: ${error.message}`);
    if (error.response) {
      log('red', `   Status: ${error.response.status}`);
      if (error.response.data) {
        log('red', `   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 CampusPe Playwright PDF Service Integration Test');
  console.log('===================================================\n');
  
  const playwrightTest = await testPlaywrightService();
  console.log('');
  
  const apiTest = await testAPIIntegration();
  console.log('');
  
  // Summary
  log('blue', '📊 Test Summary:');
  log(playwrightTest ? 'green' : 'red', `   Playwright Service: ${playwrightTest ? 'PASS' : 'FAIL'}`);
  log(apiTest ? 'green' : 'red', `   API Integration: ${apiTest ? 'PASS' : 'FAIL'}`);
  
  if (playwrightTest && apiTest) {
    log('green', '\n🎉 All tests passed! The Playwright PDF service is ready for production.');
    log('blue', '\nNext steps:');
    log('blue', '1. Update your environment variables to use the Playwright service');
    log('blue', '2. Monitor the service performance');
    log('blue', '3. Test with real resume generation workloads');
  } else {
    log('yellow', '\n⚠️ Some tests failed. Please check the configuration and try again.');
    
    if (playwrightTest && !apiTest) {
      log('blue', '\nThe Playwright service is working, but the API integration needs adjustment.');
      log('blue', 'Make sure to set PLAYWRIGHT_PDF_SERVICE_URL in your API environment variables.');
    }
  }
  
  console.log('');
}

// Run tests
runAllTests().catch(error => {
  log('red', `💥 Test execution failed: ${error.message}`);
  process.exit(1);
});
