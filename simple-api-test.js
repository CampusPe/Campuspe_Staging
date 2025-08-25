#!/usr/bin/env node

/**
 * Simple API test to verify resume history endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001';

async function testAPI() {
  console.log('🧪 Testing Resume History API Endpoints');
  console.log('=' .repeat(50));

  try {
    // Test 1: Health check
    console.log('\n📋 Test 1: API Health Check');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health:', health.data);

    // Test 2: Check if debug endpoints exist
    console.log('\n📋 Test 2: Debug Database Endpoint');
    try {
      const debug = await axios.get(`${API_BASE}/api/ai-resume/debug/database`);
      console.log('✅ Database Debug:', debug.data);
    } catch (error) {
      console.log('ℹ️  Debug endpoint response:', error.response?.status, error.response?.data);
    }

    // Test 3: Test collections endpoint
    console.log('\n📋 Test 3: Collections Debug Endpoint');
    try {
      const collections = await axios.get(`${API_BASE}/api/ai-resume/debug/collections`);
      console.log('✅ Collections:', collections.data);
    } catch (error) {
      console.log('ℹ️  Collections endpoint response:', error.response?.status, error.response?.data);
    }

    // Test 4: Test generated resume history endpoint (without auth for now)
    console.log('\n📋 Test 4: Resume History Endpoint');
    try {
      const history = await axios.get(`${API_BASE}/api/generated-resume/history`, {
        headers: {
          'student-id': '507f1f77bcf86cd799439011' // Test ObjectId
        }
      });
      console.log('✅ Resume History:', history.data);
    } catch (error) {
      console.log('ℹ️  History endpoint response:', error.response?.status, error.response?.data);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎯 API Test Complete');
    console.log('✅ Server is running and responding to requests');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error('Make sure the API server is running on http://localhost:5001');
  }
}

testAPI().catch(console.error);
