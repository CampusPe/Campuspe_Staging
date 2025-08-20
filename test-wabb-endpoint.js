#!/usr/bin/env node

// Test script for WABB integration endpoint
const axios = require('axios');

async function testWABBEndpoint() {
    console.log('🧪 Testing WABB Generate-and-Share Endpoint...\n');
    
    const testData = {
        email: 'test@campuspe.com',
        phone: '919876543210',
        name: 'Test User',
        jobDescription: 'Looking for a Software Developer with 2+ years experience in React, Node.js, and MongoDB. Must have good communication skills and be willing to learn new technologies.'
    };
    
    console.log('📤 Sending test request...');
    console.log('Data:', testData);
    
    try {
        const response = await axios.post('http://localhost:5001/api/wabb/generate-and-share', testData, {
            timeout: 60000, // 60 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\n✅ Success! Response:', {
            status: response.status,
            success: response.data.success,
            message: response.data.message,
            hasData: !!response.data.data,
            dataKeys: response.data.data ? Object.keys(response.data.data) : []
        });
        
        if (response.data.data) {
            console.log('\n📊 Response Data:', {
                resumeId: response.data.data.resumeId,
                fileName: response.data.data.fileName,
                fileSize: response.data.data.fileSize,
                sharedViaWhatsApp: response.data.data.sharedViaWhatsApp,
                downloadUrl: response.data.data.downloadUrl
            });
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
        });
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the API server is running on port 5001');
            console.log('   Try: npm run dev or npx ts-node src/app.ts');
        }
    }
}

// Test WhatsApp endpoint directly
async function testWhatsAppEndpoint() {
    console.log('\n🔄 Testing WhatsApp endpoint directly...\n');
    
    const testData = {
        phone: '919876543210',
        message: 'Test message from CampusPe WABB integration!'
    };
    
    try {
        const response = await axios.post('http://localhost:5001/api/wabb/test-whatsapp', testData, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ WhatsApp test response:', {
            status: response.status,
            data: response.data
        });
        
    } catch (error) {
        console.error('❌ WhatsApp test failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}

async function runTests() {
    console.log('🚀 Starting WABB Integration Tests...\n');
    
    // Test the main endpoint
    await testWABBEndpoint();
    
    // Test WhatsApp directly
    await testWhatsAppEndpoint();
    
    console.log('\n🏁 Tests completed!');
}

// Wait a moment for server to start, then run tests
setTimeout(() => {
    runTests().catch(console.error);
}, 3000); // Wait 3 seconds for server to start
