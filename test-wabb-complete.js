#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net';
const WEB_BASE = 'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net';

async function testWABBIntegration() {
  console.log('🧪 WABB WhatsApp Integration - Complete Testing\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing API Health...');
  try {
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ API Health:', healthResponse.data.status);
    console.log('✅ Database:', healthResponse.data.database);
  } catch (error) {
    console.log('❌ API Health failed:', error.message);
    return;
  }

  // Test 2: Frontend Page Access
  console.log('\n2️⃣ Testing Frontend Page...');
  try {
    const frontendResponse = await axios.get(`${WEB_BASE}/wabb-resume-generator`);
    console.log('✅ Frontend page accessible, response length:', frontendResponse.data.length);
  } catch (error) {
    console.log('❌ Frontend access failed:', error.message);
  }

  // Test 3: AI Resume Generation (No Auth)
  console.log('\n3️⃣ Testing AI Resume Generation...');
  try {
    const aiResponse = await axios.post(`${API_BASE}/api/ai-resume/debug-no-auth`, {
      email: 'premthakare@gmail.com',
      jobDescription: 'Software Engineer with JavaScript, React, Node.js experience'
    });
    
    if (aiResponse.data.success) {
      console.log('✅ AI Resume Generated Successfully');
      console.log('📄 Resume for:', aiResponse.data.data.personalInfo.name);
      console.log('💼 Skills:', aiResponse.data.data.skills.slice(0, 3).join(', '), '...');
    } else {
      console.log('❌ AI Generation failed:', aiResponse.data.message);
    }
  } catch (error) {
    console.log('❌ AI Generation error:', error.response?.data?.message || error.message);
  }

  // Test 4: WABB API Endpoint
  console.log('\n4️⃣ Testing WABB API Endpoint...');
  try {
    const wabbResponse = await axios.post(`${API_BASE}/api/wabb/generate-and-share`, {
      email: 'premthakare@gmail.com',
      phone: '+919156621088',
      name: 'Prem Thakare',
      jobDescription: 'Software Engineer with JavaScript, React, Node.js experience'
    });
    
    if (wabbResponse.data.success) {
      console.log('✅ WABB API Response received');
      console.log('🔗 Redirect URL:', wabbResponse.data.redirectUrl);
    } else {
      console.log('❌ WABB API failed:', wabbResponse.data.message);
    }
  } catch (error) {
    console.log('❌ WABB API error:', error.response?.data?.message || error.message);
  }

  // Test 5: Integration URLs
  console.log('\n5️⃣ Integration URLs for WABB:');
  console.log('📡 Primary Endpoint (Recommended):');
  console.log(`   ${WEB_BASE}/wabb-resume-generator?email={EMAIL}&phone={PHONE}&name={NAME}&jobDescription={JOB_DESC}`);
  console.log('\n📡 API Endpoint (Alternative):');
  console.log(`   POST ${API_BASE}/api/wabb/generate-and-share`);
  console.log('   Body: {"email": "...", "phone": "...", "name": "...", "jobDescription": "..."}');

  console.log('\n🎯 Test Example URLs:');
  const testURL = `${WEB_BASE}/wabb-resume-generator?email=premthakare@gmail.com&phone=+919156621088&name=Prem%20Thakare&jobDescription=Software%20Engineer`;
  console.log(`   ${testURL}`);

  console.log('\n📱 WhatsApp Webhooks:');
  console.log('   Success: ORlQYXvg8qk9');
  console.log('   Error: HJGMsTitkl8a');
  
  console.log('\n✅ Testing Complete!');
}

testWABBIntegration().catch(console.error);
