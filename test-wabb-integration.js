// Quick test script to debug the WABB integration
const axios = require('axios');

async function testWABBIntegration() {
    console.log('🧪 Testing WABB Integration...');
    
    const testData = {
        phone: '919876543210', // Test phone number
        jobId: 'test-job-123',
        companyName: 'Test Company',
        position: 'Software Developer'
    };
    
    try {
        // Test the generate-and-share endpoint
        console.log('📞 Testing generate-and-share endpoint...');
        const response = await axios.post('http://localhost:3001/api/wabb/generate-and-share', testData, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Response received:', {
            status: response.status,
            data: response.data
        });
        
        // Test WhatsApp endpoint directly
        console.log('📱 Testing WhatsApp endpoint...');
        const whatsappResponse = await axios.post('http://localhost:3001/api/wabb/test-whatsapp', {
            phone: testData.phone,
            message: 'Test message from CampusPe!'
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📱 WhatsApp test response:', {
            status: whatsappResponse.status,
            data: whatsappResponse.data
        });
        
    } catch (error) {
        console.error('❌ Test failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url
        });
    }
}

// Test different WABB webhook URLs directly
async function testWABBWebhooks() {
    console.log('🔗 Testing WABB Webhook URLs directly...');
    
    const testPhone = '919876543210';
    const testMessage = 'Hello from CampusPe! This is a test message.';
    
    const webhookUrls = [
        'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/',
        'https://api.wabb.in/220/HJGMsTitkl8a/webhook',
        'https://api.wabb.in/webhooks/220/HJGMsTitkl8a'
    ];
    
    for (const url of webhookUrls) {
        try {
            console.log(`🔗 Testing webhook: ${url}`);
            const fullUrl = `${url}?phone=${testPhone}&message=${encodeURIComponent(testMessage)}`;
            
            const response = await axios.get(fullUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'CampusPe-Test/1.0',
                    'Accept': 'application/json'
                }
            });
            
            console.log(`✅ Webhook ${url} responded:`, {
                status: response.status,
                data: response.data
            });
            
        } catch (error) {
            console.log(`❌ Webhook ${url} failed:`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        }
    }
}

async function runTests() {
    console.log('🚀 Starting WABB Integration Tests...\n');
    
    // First test the webhook URLs directly
    await testWABBWebhooks();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Then test the API endpoints
    await testWABBIntegration();
    
    console.log('\n🏁 Tests completed!');
}

// Run the tests
runTests().catch(console.error);
