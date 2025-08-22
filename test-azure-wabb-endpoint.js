#!/usr/bin/env node

/**
 * Test script for Azure WABB Resume Generation Endpoint
 * Tests both localhost and Azure production endpoints
 */

const https = require('https');
const http = require('http');

// Test configurations
const tests = [
  {
    name: 'Localhost Test',
    url: 'http://localhost:5001/api/wabb/generate-resume-complete',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      "email": "premthakare@gmail.com",
      "phone": "+919156621088",
      "name": "Prem Thakare",
      "jobDescription": "Software Engineer with JavaScript, React, Node.js experience. Looking for full-stack developer role with 2+ years experience in modern web technologies."
    }
  },
  {
    name: 'Azure Production Test',
    url: 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb/generate-resume-complete',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      "name": "Prem Thakare",
      "email": "premthakare@gmail.com",
      "phone": "+919156621088",
      "jobDescription": "Software Engineer with JavaScript, React, Node.js experience. Looking for full-stack developer role with 2+ years experience in modern web technologies."
    }
  }
];

function makeRequest(config) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.url);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const requestData = JSON.stringify(config.data);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: config.method,
      headers: {
        ...config.headers,
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    console.log(`\n🧪 Testing: ${config.name}`);
    console.log(`📡 URL: ${config.url}`);
    console.log(`📤 Payload:`, config.data);
    
    const req = lib.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (parseError) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers,
            parseError: parseError.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject({
        error: error.message,
        config: config.name
      });
    });
    
    req.setTimeout(60000, () => {
      req.destroy();
      reject({
        error: 'Request timeout (60s)',
        config: config.name
      });
    });
    
    req.write(requestData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting WABB Resume Generation Endpoint Tests\n');
  
  for (const test of tests) {
    try {
      const startTime = Date.now();
      const result = await makeRequest(test);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ ${test.name} completed in ${duration}ms`);
      console.log(`📊 Status Code: ${result.statusCode}`);
      
      if (result.data) {
        if (typeof result.data === 'object') {
          console.log(`📋 Response:`, JSON.stringify(result.data, null, 2));
          
          // Analyze response for completeness
          if (result.data.success) {
            console.log('✅ Success: Resume generation successful');
            
            if (result.data.data?.downloadUrl) {
              console.log('✅ Download URL provided:', result.data.data.downloadUrl);
            } else {
              console.log('⚠️ No download URL in response');
            }
            
            if (result.data.data?.formattedPhone) {
              console.log('✅ Formatted phone provided:', result.data.data.formattedPhone);
            } else {
              console.log('⚠️ No formatted phone in response');
            }
          } else {
            console.log('❌ Failure:', result.data.message || 'Unknown error');
          }
        } else {
          console.log(`📋 Raw Response:`, result.data);
        }
      }
      
      if (result.parseError) {
        console.log(`⚠️ Parse Error: ${result.parseError}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name} failed:`, error);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  console.log('🏁 All tests completed!');
}

// Run the tests
runTests().catch(console.error);
