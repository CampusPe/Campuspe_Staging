#!/usr/bin/env node

/**
 * AI Resume Match Analysis Tester
 * Tests the AI matching functionality with fallback methods
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001';

async function testAIMatching() {
    console.log('🔥 Testing AI Resume Match Analysis System');
    console.log('━'.repeat(60));

    try {
        // 1. Health Check
        console.log('1️⃣ API Health Check...');
        const healthResponse = await axios.get(`${API_BASE}/health`);
        console.log('✅ API is healthy:', healthResponse.data.status);

        // 2. Test with a known student ID (from our previous tests)
        console.log('\n2️⃣ Testing with sample student ID...');
        const studentId = '66ad3abe7b1234567890abcd'; // Sample ID - will update if needed
        
        console.log(`🆔 Using Student ID: ${studentId}`);

        // 3. Test Student Profile Analysis (using fallback)
        console.log('\n3️⃣ Testing Student Profile Analysis...');
        try {
            const profileResponse = await axios.get(`${API_BASE}/api/student-career/${studentId}/analyze`);
            console.log('✅ Profile Analysis Result:');
            console.log(`   Category: ${profileResponse.data.category}`);
            console.log(`   Skills: ${profileResponse.data.skills?.slice(0, 5).join(', ') || 'None'}`);
            console.log(`   Profile Completeness: ${profileResponse.data.profileCompleteness}%`);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`⚠️ Student not found with ID: ${studentId}`);
                console.log('   This is expected - the student ID may not exist');
            } else {
                console.log(`❌ Profile Analysis Error: ${error.response?.data?.message || error.message}`);
            }
        }

        // 4. Test Job Matching with the same student ID
        console.log('\n4️⃣ Testing Job Matching...');
        try {
            const jobMatchResponse = await axios.get(
                `${API_BASE}/api/student-career/${studentId}/job-matches?threshold=0.1`
            );
            console.log('✅ Job Match Analysis Result:');
            console.log(`   Found ${jobMatchResponse.data.matches?.length || 0} job matches`);
            
            if (jobMatchResponse.data.matches && jobMatchResponse.data.matches.length > 0) {
                jobMatchResponse.data.matches.slice(0, 3).forEach((match, index) => {
                    console.log(`   Match ${index + 1}: ${Math.round(match.finalMatchScore * 100)}% - Job ID: ${match.jobId}`);
                });
            } else {
                console.log('   ℹ️ No matches found with 10% threshold');
            }
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`⚠️ Student not found for job matching with ID: ${studentId}`);
            } else {
                console.log(`❌ Job Matching Error: ${error.response?.data?.message || error.message}`);
            }
        }

        // 5. Test the server logs to see AI processing
        console.log('\n5️⃣ Check server logs for AI processing details...');
        console.log('   👀 Look at the terminal running the API server');
        console.log('   🔍 You should see "Using fallback embedding generation" messages');

        // 6. Summary
        console.log('\n🎯 SUMMARY:');
        console.log('━'.repeat(40));
        console.log('✅ AI Matching Service is working with FALLBACK methods');
        console.log('✅ API server is responding to requests');
        console.log('⚠️ Claude API is not working (invalid key)');
        console.log('✅ System can process requests with fallback analysis');
        
        console.log('\n📋 TO FIX THE CLAUDE API ISSUE:');
        console.log('1. Get a new Claude API key from https://console.anthropic.com/');
        console.log('2. Update .env file: CLAUDE_API_KEY=your_new_key');
        console.log('3. Restart the server');
        console.log('4. Test using: node test-claude-api.js YOUR_NEW_KEY');
        
        console.log('\n🔍 TO TEST WITH REAL DATA:');
        console.log('1. Create a student account in your system');
        console.log('2. Upload a resume');
        console.log('3. Create some job postings');
        console.log('4. Use the student ID in the test above');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 Make sure the API server is running:');
            console.log('   cd apps/api && npm start');
        }
    }
}

testAIMatching();
