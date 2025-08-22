#!/usr/bin/env node

/**
 * Manual Webhook Trigger Test
 * Simulates triggering the webhook with downloadUrl and phone
 */

const https = require('https');

async function triggerWebhook() {
  const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
  
  const payload = {
    phone: '+919156621088',
    downloadUrl: 'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net/generated-resume/resume_1755840351308_tp801x79p',
    studentName: 'Prem Thakare',
    email: 'premthakare@gmail.com',
    resumeId: 'resume_1755840351308_tp801x79p',
    timestamp: new Date().toISOString(),
    source: 'campuspe-api',
    action: 'resume-ready'
  };
  
  console.log('🎯 Triggering webhook manually...');
  console.log('📡 URL:', webhookUrl);
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  
  return new Promise((resolve, reject) => {
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
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Webhook response status: ${res.statusCode}`);
        console.log(`📋 Response data:`, responseData);
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
}

// Run the webhook test
triggerWebhook()
  .then(result => {
    console.log('🎉 Webhook trigger completed successfully!');
  })
  .catch(error => {
    console.log('❌ Webhook trigger failed:', error.message);
  });
