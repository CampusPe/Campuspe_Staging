#!/usr/bin/env node

/**
 * Comprehensive Production-Level Testing for Playwright PDF Service
 * Tests all endpoints, performance, error handling, and production scenarios
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SERVICE_URL = 'https://campuspe-playwright-pdf.azurewebsites.net';
const STAGING_URL = 'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function addTestResult(testName, status, message, duration = 0, metadata = {}) {
  const result = {
    test: testName,
    status,
    message,
    duration,
    metadata,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (status === 'PASS') {
    testResults.passed++;
    log('green', `✅ ${testName}: ${message} (${duration}ms)`);
  } else if (status === 'FAIL') {
    testResults.failed++;
    log('red', `❌ ${testName}: ${message}`);
  } else if (status === 'WARN') {
    testResults.warnings++;
    log('yellow', `⚠️ ${testName}: ${message}`);
  }
}

async function testEndpoint(testName, method, endpoint, payload = null, expectedStatus = 200) {
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url: `${SERVICE_URL}${endpoint}`,
      timeout: 60000,
      ...(payload && { data: payload })
    };
    
    if (method === 'POST') {
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    const duration = Date.now() - startTime;
    
    if (response.status === expectedStatus) {
      addTestResult(testName, 'PASS', `Status ${response.status}, Response size: ${JSON.stringify(response.data).length} bytes`, duration, {
        responseSize: JSON.stringify(response.data).length,
        headers: response.headers
      });
      return response.data;
    } else {
      addTestResult(testName, 'FAIL', `Expected status ${expectedStatus}, got ${response.status}`);
      return null;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    addTestResult(testName, 'FAIL', `${error.message}`, duration);
    return null;
  }
}

async function testRootEndpoint() {
  log('blue', '🏠 Testing Root Endpoint...');
  const result = await testEndpoint('Root Endpoint', 'GET', '/');
  
  if (result && result.service && result.endpoints) {
    log('green', '   ✓ Service information returned');
    log('blue', `   Service: ${result.service} v${result.version}`);
  }
}

async function testHealthEndpoint() {
  log('blue', '🏥 Testing Health Endpoint...');
  const result = await testEndpoint('Health Check', 'GET', '/health');
  
  if (result && result.status === 'OK') {
    log('green', '   ✓ Service is healthy');
    log('blue', `   Uptime: ${Math.round(result.uptime)}s`);
    log('blue', `   Memory: ${Math.round(result.memory.rss / 1024 / 1024)}MB RSS`);
  }
}

async function testDocumentationEndpoint() {
  log('blue', '📚 Testing Documentation Endpoint...');
  const result = await testEndpoint('API Documentation', 'GET', '/docs');
  
  if (result && result.endpoints && Array.isArray(result.endpoints)) {
    log('green', `   ✓ Documentation available (${result.endpoints.length} endpoints documented)`);
  }
}

async function testPDFGenerationBasic() {
  log('blue', '📄 Testing Basic PDF Generation...');
  
  const basicHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Basic Test</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2563eb; }
        </style>
      </head>
      <body>
        <h1>Basic PDF Test</h1>
        <p>This is a simple test document.</p>
      </body>
    </html>
  `;
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${SERVICE_URL}/generate-pdf`, {
      html: basicHtml,
      options: {
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      }
    }, {
      timeout: 60000,
      responseType: 'arraybuffer'
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status === 200 && response.data.byteLength > 1000) {
      fs.writeFileSync('test-basic-pdf.pdf', response.data);
      addTestResult('Basic PDF Generation', 'PASS', `Generated ${response.data.byteLength} bytes`, duration, {
        pdfSize: response.data.byteLength
      });
    } else {
      addTestResult('Basic PDF Generation', 'FAIL', 'Invalid PDF response');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    addTestResult('Basic PDF Generation', 'FAIL', error.message, duration);
  }
}

async function testPDFGenerationComplex() {
  log('blue', '📄 Testing Complex PDF Generation (Resume-like)...');
  
  const complexHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Complex Resume Test</title>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: white;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          
          .header {
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            margin-bottom: 30px;
          }
          
          .name {
            font-size: 36px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 10px;
          }
          
          .title {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 15px;
          }
          
          .contact {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
          }
          
          .contact-item {
            color: #4b5563;
            font-size: 14px;
          }
          
          .section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 20px;
          }
          
          .experience-item, .education-item {
            margin-bottom: 20px;
            padding-left: 20px;
            border-left: 3px solid #e5e7eb;
          }
          
          .job-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }
          
          .company {
            font-size: 14px;
            color: #2563eb;
            font-weight: 500;
          }
          
          .duration {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 10px;
          }
          
          .description {
            font-size: 14px;
            color: #4b5563;
          }
          
          .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .skill-tag {
            background: #eff6ff;
            color: #2563eb;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
          }
          
          @media print {
            body { font-size: 12px; }
            .container { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="name">John Smith</div>
            <div class="title">Senior Software Engineer</div>
            <div class="contact">
              <div class="contact-item">john.smith@email.com</div>
              <div class="contact-item">+1 (555) 123-4567</div>
              <div class="contact-item">LinkedIn: linkedin.com/in/johnsmith</div>
              <div class="contact-item">GitHub: github.com/johnsmith</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Professional Experience</div>
            
            <div class="experience-item">
              <div class="job-title">Senior Software Engineer</div>
              <div class="company">TechCorp Solutions</div>
              <div class="duration">January 2022 - Present</div>
              <div class="description">
                • Led development of microservices architecture serving 10M+ users<br>
                • Implemented CI/CD pipelines reducing deployment time by 75%<br>
                • Mentored team of 5 junior developers<br>
                • Technologies: React, Node.js, Azure, Docker, Kubernetes
              </div>
            </div>
            
            <div class="experience-item">
              <div class="job-title">Software Engineer</div>
              <div class="company">InnovateTech</div>
              <div class="duration">June 2020 - December 2021</div>
              <div class="description">
                • Developed and maintained web applications using modern frameworks<br>
                • Optimized database queries improving performance by 40%<br>
                • Collaborated with cross-functional teams in Agile environment<br>
                • Technologies: Vue.js, Python, PostgreSQL, AWS
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Education</div>
            
            <div class="education-item">
              <div class="job-title">Bachelor of Science in Computer Science</div>
              <div class="company">University of Technology</div>
              <div class="duration">2016 - 2020</div>
              <div class="description">
                GPA: 3.8/4.0 • Dean's List • Relevant Coursework: Data Structures, Algorithms, Software Engineering
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Technical Skills</div>
            <div class="skills">
              <div class="skill-tag">JavaScript</div>
              <div class="skill-tag">TypeScript</div>
              <div class="skill-tag">React</div>
              <div class="skill-tag">Node.js</div>
              <div class="skill-tag">Python</div>
              <div class="skill-tag">Azure</div>
              <div class="skill-tag">AWS</div>
              <div class="skill-tag">Docker</div>
              <div class="skill-tag">Kubernetes</div>
              <div class="skill-tag">PostgreSQL</div>
              <div class="skill-tag">MongoDB</div>
              <div class="skill-tag">Git</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${SERVICE_URL}/generate-pdf`, {
      html: complexHtml,
      options: {
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        printBackground: true
      }
    }, {
      timeout: 90000,
      responseType: 'arraybuffer'
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status === 200 && response.data.byteLength > 5000) {
      fs.writeFileSync('test-complex-resume.pdf', response.data);
      addTestResult('Complex PDF Generation', 'PASS', `Generated ${response.data.byteLength} bytes`, duration, {
        pdfSize: response.data.byteLength
      });
    } else {
      addTestResult('Complex PDF Generation', 'FAIL', 'Invalid PDF response');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    addTestResult('Complex PDF Generation', 'FAIL', error.message, duration);
  }
}

async function testPDFFromUrl() {
  log('blue', '🔗 Testing PDF Generation from URL...');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${SERVICE_URL}/generate-pdf-from-url`, {
      url: 'https://example.com',
      options: {
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      }
    }, {
      timeout: 90000,
      responseType: 'arraybuffer'
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status === 200 && response.data.byteLength > 1000) {
      fs.writeFileSync('test-url-pdf.pdf', response.data);
      addTestResult('URL to PDF Generation', 'PASS', `Generated ${response.data.byteLength} bytes`, duration, {
        pdfSize: response.data.byteLength
      });
    } else {
      addTestResult('URL to PDF Generation', 'FAIL', 'Invalid PDF response');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    addTestResult('URL to PDF Generation', 'FAIL', error.message, duration);
  }
}

async function testStagingWebAppIntegration() {
  log('blue', '🌐 Testing Staging Web App Integration...');
  
  try {
    // First, check if staging app is accessible
    const stagingResponse = await axios.get(STAGING_URL, { timeout: 10000 });
    
    if (stagingResponse.status === 200) {
      addTestResult('Staging App Access', 'PASS', 'Staging app is accessible');
      
      // Test if we can generate PDF from staging app
      try {
        const pdfResponse = await axios.post(`${SERVICE_URL}/generate-pdf-from-url`, {
          url: STAGING_URL,
          options: {
            format: 'A4',
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
          }
        }, {
          timeout: 120000,
          responseType: 'arraybuffer'
        });
        
        if (pdfResponse.status === 200 && pdfResponse.data.byteLength > 1000) {
          fs.writeFileSync('test-staging-app.pdf', pdfResponse.data);
          addTestResult('Staging App PDF', 'PASS', `Generated PDF from staging app (${pdfResponse.data.byteLength} bytes)`);
        } else {
          addTestResult('Staging App PDF', 'FAIL', 'Failed to generate PDF from staging app');
        }
      } catch (error) {
        addTestResult('Staging App PDF', 'FAIL', `PDF generation failed: ${error.message}`);
      }
    } else {
      addTestResult('Staging App Access', 'FAIL', `Staging app returned status ${stagingResponse.status}`);
    }
  } catch (error) {
    addTestResult('Staging App Access', 'FAIL', `Cannot access staging app: ${error.message}`);
  }
}

async function testErrorHandling() {
  log('blue', '🚨 Testing Error Handling...');
  
  // Test missing HTML
  await testEndpoint('Missing HTML Error', 'POST', '/generate-pdf', {}, 400);
  
  // Test invalid URL
  await testEndpoint('Invalid URL Error', 'POST', '/generate-pdf-from-url', { url: 'invalid-url' }, 400);
  
  // Test malformed HTML
  const malformedHtml = '<html><body><h1>Unclosed tag<body></html>';
  await testEndpoint('Malformed HTML Handling', 'POST', '/generate-pdf', { html: malformedHtml }, 200);
}

async function testPerformance() {
  log('blue', '⚡ Testing Performance...');
  
  const simpleHtml = '<html><body><h1>Performance Test</h1><p>Simple content for performance testing.</p></body></html>';
  
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(
      axios.post(`${SERVICE_URL}/generate-pdf`, { html: simpleHtml }, {
        timeout: 60000,
        responseType: 'arraybuffer'
      })
    );
  }
  
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.status === 200 && r.data.byteLength > 500).length;
    
    if (successful === 3) {
      addTestResult('Concurrent PDF Generation', 'PASS', `Generated 3 PDFs concurrently`, duration);
    } else {
      addTestResult('Concurrent PDF Generation', 'FAIL', `Only ${successful}/3 PDFs generated successfully`);
    }
  } catch (error) {
    addTestResult('Concurrent PDF Generation', 'FAIL', error.message);
  }
}

async function testTestEndpoint() {
  log('blue', '🧪 Testing Test Endpoint...');
  const result = await testEndpoint('Test Endpoint', 'GET', '/test');
  
  if (result && result.success) {
    log('green', '   ✓ Test endpoint working');
    if (result.pdfSize) {
      log('blue', `   Generated test PDF: ${result.pdfSize} bytes`);
    }
  }
}

function generateReport() {
  log('blue', '\n📊 Generating Test Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    service: SERVICE_URL,
    summary: {
      total: testResults.tests.length,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      successRate: `${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`
    },
    performance: {
      averagePdfGeneration: 0,
      totalTestDuration: 0
    },
    tests: testResults.tests
  };
  
  // Calculate performance metrics
  const pdfTests = testResults.tests.filter(t => t.test.includes('PDF Generation') && t.status === 'PASS');
  if (pdfTests.length > 0) {
    report.performance.averagePdfGeneration = Math.round(
      pdfTests.reduce((sum, test) => sum + test.duration, 0) / pdfTests.length
    );
  }
  
  report.performance.totalTestDuration = testResults.tests.reduce((sum, test) => sum + test.duration, 0);
  
  // Save report
  fs.writeFileSync('playwright-service-test-report.json', JSON.stringify(report, null, 2));
  
  // Console summary
  console.log('\n' + '='.repeat(80));
  log('cyan', '🎯 PLAYWRIGHT PDF SERVICE TEST RESULTS');
  console.log('='.repeat(80));
  
  log('blue', `Service URL: ${SERVICE_URL}`);
  log('blue', `Total Tests: ${report.summary.total}`);
  log('green', `Passed: ${report.summary.passed}`);
  log('red', `Failed: ${report.summary.failed}`);
  log('yellow', `Warnings: ${report.summary.warnings}`);
  log('cyan', `Success Rate: ${report.summary.successRate}`);
  
  if (report.performance.averagePdfGeneration > 0) {
    log('blue', `Average PDF Generation Time: ${report.performance.averagePdfGeneration}ms`);
  }
  
  log('blue', `Total Test Duration: ${Math.round(report.performance.totalTestDuration / 1000)}s`);
  
  console.log('\n' + '='.repeat(80));
  
  if (testResults.failed === 0) {
    log('green', '🎉 ALL TESTS PASSED! Service is production ready.');
  } else {
    log('red', '❌ Some tests failed. Please review the issues before production deployment.');
  }
  
  log('blue', '\nGenerated files:');
  log('blue', '• playwright-service-test-report.json (Full test report)');
  
  const generatedPdfs = [
    'test-basic-pdf.pdf',
    'test-complex-resume.pdf', 
    'test-url-pdf.pdf',
    'test-staging-app.pdf'
  ].filter(file => fs.existsSync(file));
  
  generatedPdfs.forEach(file => {
    const stats = fs.statSync(file);
    log('blue', `• ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
  
  console.log('\n');
}

async function runAllTests() {
  console.log('\n🚀 COMPREHENSIVE PLAYWRIGHT PDF SERVICE TESTING');
  console.log('='.repeat(80));
  console.log(`Service: ${SERVICE_URL}`);
  console.log(`Staging: ${STAGING_URL}`);
  console.log('='.repeat(80) + '\n');
  
  try {
    // Basic endpoint tests
    await testRootEndpoint();
    await testHealthEndpoint();
    await testDocumentationEndpoint();
    await testTestEndpoint();
    
    // PDF generation tests
    await testPDFGenerationBasic();
    await testPDFGenerationComplex();
    await testPDFFromUrl();
    
    // Integration tests
    await testStagingWebAppIntegration();
    
    // Error handling tests
    await testErrorHandling();
    
    // Performance tests
    await testPerformance();
    
    // Generate final report
    generateReport();
    
  } catch (error) {
    log('red', `💥 Test suite execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test suite
runAllTests().catch(error => {
  log('red', `💥 Unexpected error: ${error.message}`);
  process.exit(1);
});
