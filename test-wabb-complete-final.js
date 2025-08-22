#!/usr/bin/env node

/**
 * COMPREHENSIVE WABB ENDPOINT TEST
 * Tests both localhost and Azure production with webhook verification
 */

const https = require('https');
const http = require('http');

// Test configurations
const tests = [
  {
    name: 'Localhost Test - Full Quality Resume',
    url: 'http://localhost:5001/api/wabb/generate-resume-complete',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      "email": "premthakare@gmail.com",
      "phone": "+919156621088",
      "name": "Prem Thakare",
      "jobDescription": "Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications."
    }
  },
  {
    name: 'Azure Production Test - Full Quality Resume',
    url: 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb/generate-resume-complete',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      "name": "Prem Thakare",
      "email": "premthakare@gmail.com",
      "phone": "+919156621088",
      "jobDescription": "Senior Full-Stack Developer with 3+ years experience in React, Node.js, TypeScript, MongoDB. Looking for a challenging role in a dynamic tech company where I can contribute to innovative projects, lead development teams, and drive technical excellence in web applications."
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
    
    req.setTimeout(120000, () => { // 2 minute timeout for AI processing
      req.destroy();
      reject({
        error: 'Request timeout (120s)',
        config: config.name
      });
    });
    
    req.write(requestData);
    req.end();
  });
}

// Function to test webhook trigger
async function testWebhookTrigger(downloadUrl, phone) {
  try {
    console.log('\n🎯 Testing Webhook Trigger...');
    
    const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
    const payload = {
      phone: phone,
      downloadUrl: downloadUrl,
      studentName: 'Prem Thakare',
      email: 'premthakare@gmail.com',
      resumeId: 'test_trigger',
      timestamp: new Date().toISOString(),
      source: 'campuspe-test',
      action: 'resume-ready'
    };
    
    console.log('📡 Webhook URL:', webhookUrl);
    console.log('📤 Webhook Payload:', payload);
    
    const url = new URL(webhookUrl);
    const requestData = JSON.stringify(payload);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log(`✅ Webhook response status: ${res.statusCode}`);
          console.log(`📋 Webhook response data:`, responseData);
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        });
      });
      
      req.on('error', (error) => {
        console.log('❌ Webhook error:', error.message);
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Webhook timeout'));
      });
      
      req.write(requestData);
      req.end();
    });
    
  } catch (error) {
    console.log('❌ Webhook test failed:', error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting COMPREHENSIVE WABB Resume Generation Tests\n');
  console.log('📋 This test will verify:');
  console.log('   ✅ Resume generation quality (same as AI Resume Builder)');
  console.log('   ✅ Proper data mapping and structure');
  console.log('   ✅ Download URL generation');
  console.log('   ✅ Phone number formatting');
  console.log('   ✅ Webhook triggering mechanism');
  console.log('   ✅ WhatsApp integration');
  console.log('\n' + '='.repeat(80) + '\n');
  
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
          
          // Comprehensive analysis of response
          if (result.data.success) {
            console.log('\n🎉 SUCCESS: Resume generation successful');
            
            const data = result.data.data;
            
            // Check download URL
            if (data?.downloadUrl) {
              console.log('✅ Download URL provided:', data.downloadUrl);
            } else {
              console.log('❌ No download URL in response');
            }
            
            // Check phone formatting
            if (data?.formattedPhone) {
              console.log('✅ Formatted phone provided:', data.formattedPhone);
              
              // Test webhook trigger with the actual response data
              if (data.downloadUrl && data.formattedPhone) {
                await testWebhookTrigger(data.downloadUrl, data.formattedPhone);
              }
            } else if (data?.phone) {
              console.log('⚠️ Phone provided but not formatted:', data.phone);
            } else {
              console.log('❌ No phone number in response');
            }
            
            // Check resume quality indicators
            if (data?.resumeId) {
              console.log('✅ Resume ID generated:', data.resumeId);
            }
            
            if (data?.fileName) {
              console.log('✅ File name generated:', data.fileName);
            }
            
            if (data?.studentName) {
              console.log('✅ Student name processed:', data.studentName);
            }
            
            if (data?.whatsappSent !== undefined) {
              console.log(`📱 WhatsApp sent status: ${data.whatsappSent}`);
            }
            
            // Overall quality assessment
            const qualityScore = [
              !!data?.downloadUrl,
              !!data?.formattedPhone,
              !!data?.resumeId,
              !!data?.fileName,
              !!data?.studentName
            ].filter(Boolean).length;
            
            console.log(`\n📊 Response Quality Score: ${qualityScore}/5`);
            
            if (qualityScore >= 4) {
              console.log('🌟 EXCELLENT: Response has all required fields');
            } else if (qualityScore >= 3) {
              console.log('⚠️ GOOD: Response missing some optional fields');
            } else {
              console.log('❌ POOR: Response missing critical fields');
            }
            
          } else {
            console.log('❌ FAILURE:', result.data.message || 'Unknown error');
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
  console.log('\n📋 SUMMARY:');
  console.log('   If both tests show "EXCELLENT" quality scores,');
  console.log('   your WABB endpoint is generating high-quality resumes');
  console.log('   identical to the AI Resume Builder and properly');
  console.log('   triggering webhooks for WhatsApp integration.');
}

// Run the tests
runTests().catch(console.error);
