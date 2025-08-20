#!/usr/bin/env node

// Comprehensive test for WABB integration debugging
const axios = require('axios');

async function testFullFlow() {
    console.log('🔍 Starting comprehensive WABB integration test...\n');
    
    const apiBaseUrl = 'http://localhost:5001';
    
    // Test 1: Check if API server is running
    console.log('1️⃣ Testing API server connection...');
    try {
        const healthResponse = await axios.get(`${apiBaseUrl}/health`, { timeout: 5000 });
        console.log('✅ API server is running:', healthResponse.status);
    } catch (error) {
        console.error('❌ API server not reachable:', error.message);
        console.log('💡 Please start the server with: cd apps/api && npx ts-node src/app.ts');
        return;
    }
    
    // Test 2: Check user existence (debug endpoint)
    console.log('\n2️⃣ Testing user existence check...');
    try {
        const debugResponse = await axios.get(`${apiBaseUrl}/api/wabb/debug-user/test@campuspe.com`, { timeout: 10000 });
        console.log('✅ Debug user response:', {
            studentExists: debugResponse.data.studentExists,
            userExists: debugResponse.data.userExists,
            studentData: debugResponse.data.studentData ? 'Present' : 'Missing',
            userData: debugResponse.data.userData ? 'Present' : 'Missing'
        });
    } catch (error) {
        console.error('❌ User debug failed:', error.response?.data || error.message);
    }
    
    // Test 3: Test WhatsApp mock service directly
    console.log('\n3️⃣ Testing WhatsApp mock service...');
    try {
        const whatsappResponse = await axios.post(`${apiBaseUrl}/api/wabb/test-whatsapp`, {
            phone: '919876543210',
            message: 'Test message from comprehensive debugging script'
        }, { timeout: 10000 });
        console.log('✅ WhatsApp test response:', {
            success: whatsappResponse.data.success,
            mock: whatsappResponse.data.result?.mock || false,
            message: whatsappResponse.data.message
        });
    } catch (error) {
        console.error('❌ WhatsApp test failed:', error.response?.data || error.message);
    }
    
    // Test 4: Test resume generation with debug mode
    console.log('\n4️⃣ Testing resume generation (debug mode)...');
    try {
        const resumeResponse = await axios.post(`${apiBaseUrl}/api/wabb/debug-generate-and-share`, {
            email: 'test@campuspe.com',
            phone: '919876543210',
            name: 'Test User',
            jobDescription: 'Looking for a Software Developer with experience in React, Node.js, and MongoDB. Strong problem-solving skills required.'
        }, { 
            timeout: 120000,  // 2 minutes for resume generation
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ Resume generation response:', {
            success: resumeResponse.data.success,
            hasData: !!resumeResponse.data.data,
            resumeId: resumeResponse.data.data?.resumeId,
            fileName: resumeResponse.data.data?.fileName,
            fileSize: resumeResponse.data.data?.fileSize,
            downloadUrl: resumeResponse.data.data?.downloadUrl,
            sharedViaWhatsApp: resumeResponse.data.data?.sharedViaWhatsApp
        });
    } catch (error) {
        console.error('❌ Resume generation failed:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            code: error.response?.data?.code
        });
    }
    
    // Test 5: Test the main endpoint
    console.log('\n5️⃣ Testing main generate-and-share endpoint...');
    try {
        const mainResponse = await axios.post(`${apiBaseUrl}/api/wabb/generate-and-share`, {
            email: 'test@campuspe.com',
            phone: '919876543210',
            name: 'Test User',
            jobDescription: 'Software Developer position requiring JavaScript, React, Node.js, and database experience. Must have good communication skills.'
        }, { 
            timeout: 120000,  // 2 minutes for resume generation
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ Main endpoint response:', {
            success: mainResponse.data.success,
            hasData: !!mainResponse.data.data,
            message: mainResponse.data.message
        });
        
        if (mainResponse.data.data) {
            console.log('📊 Generated resume details:', {
                resumeId: mainResponse.data.data.resumeId,
                fileName: mainResponse.data.data.fileName,
                fileSize: mainResponse.data.data.fileSize,
                downloadUrl: mainResponse.data.data.downloadUrl,
                sharedViaWhatsApp: mainResponse.data.data.sharedViaWhatsApp,
                autoShared: mainResponse.data.data.metadata?.autoShared
            });
        }
    } catch (error) {
        console.error('❌ Main endpoint failed:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            code: error.response?.data?.code
        });
    }
    
    console.log('\n🏁 Comprehensive test completed!');
    console.log('\n📋 Check the server console logs for detailed debug information');
}

// Run the comprehensive test
testFullFlow().catch(console.error);
