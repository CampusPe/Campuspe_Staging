#!/usr/bin/env node

// Simple test for WABB WhatsApp integration
const axios = require('axios');

async function testWhatsAppDirectly() {
    console.log('🧪 Testing WABB WhatsApp Integration...\n');
    
    const testPhone = '919876543210';
    const testMessage = 'Hello! This is a test message from CampusPe. Your AI-powered resume is ready!';
    
    const webhookUrls = [
        'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/',
        'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/',
        'https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/',
        'https://api.wabb.in/api/v1/webhooks-automation/catch/220/4nVuxt446PLJ/'
    ];
    
    for (let i = 0; i < webhookUrls.length; i++) {
        const url = webhookUrls[i];
        console.log(`\n🔗 Testing webhook ${i + 1}/${webhookUrls.length}: ${url}`);
        
        try {
            // Test POST method
            console.log('📤 Trying POST method...');
            const postResponse = await axios.post(url, {
                phone: testPhone,
                message: testMessage
            }, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CampusPe-Test/1.0'
                }
            });
            
            console.log('✅ POST Success:', {
                status: postResponse.status,
                data: postResponse.data
            });
            
            // If POST works, we found a working webhook
            console.log('\n🎉 Found working webhook URL:', url);
            console.log('✅ Use POST method with JSON payload');
            break;
            
        } catch (postError) {
            console.log('❌ POST failed:', postError.response?.status || postError.message);
            
            try {
                // Test GET method as fallback
                console.log('📥 Trying GET method...');
                const getUrl = `${url}?phone=${testPhone}&message=${encodeURIComponent(testMessage)}`;
                const getResponse = await axios.get(getUrl, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'CampusPe-Test/1.0'
                    }
                });
                
                console.log('✅ GET Success:', {
                    status: getResponse.status,
                    data: getResponse.data
                });
                
                // If GET works, we found a working webhook
                console.log('\n🎉 Found working webhook URL:', url);
                console.log('✅ Use GET method with query parameters');
                break;
                
            } catch (getError) {
                console.log('❌ GET failed:', getError.response?.status || getError.message);
                console.log('💡 Trying next webhook...');
            }
        }
    }
    
    console.log('\n🏁 Test completed!');
}

// Run the test
testWhatsAppDirectly().catch(console.error);
