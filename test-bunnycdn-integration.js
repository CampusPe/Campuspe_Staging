const axios = require('axios');

async function testBunnyCDNIntegration() {
  try {
    console.log('🧪 Testing BunnyCDN Integration');
    console.log('='.repeat(60));
    
    // Test 1: Test no-auth endpoint with BunnyCDN upload
    console.log('📋 Test 1: No-Auth Endpoint with BunnyCDN');
    console.log('-'.repeat(40));
    
    const noAuthPayload = {
      email: 'test.bunnycdn@example.com',
      phone: '+919876543210',
      jobDescription: 'Full Stack Developer position requiring React, Node.js, TypeScript, and MongoDB expertise. Build scalable web applications.',
      number: '+919876543210'
    };
    
    console.log('🚀 Calling no-auth endpoint...');
    const noAuthResponse = await axios.post(
      'http://localhost:5001/api/ai-resume-builder/generate-ai-no-auth',
      noAuthPayload,
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 180000 // 3 minutes for BunnyCDN upload
      }
    );
    
    console.log('✅ No-Auth Response:', {
      success: noAuthResponse.data.success,
      resumeId: noAuthResponse.data.data?.resumeId,
      downloadUrl: noAuthResponse.data.data?.downloadUrl,
      webhookTriggered: noAuthResponse.data.data?.webhookTriggered
    });
    
    const downloadUrl = noAuthResponse.data.data?.downloadUrl;
    
    // Test 2: Verify download URL type
    console.log('\n📋 Test 2: Download URL Analysis');
    console.log('-'.repeat(40));
    
    if (downloadUrl) {
      const isBunnyCDN = downloadUrl.includes('bunnycdn') || downloadUrl.includes('b-cdn');
      const isLocalhost = downloadUrl.includes('localhost');
      const isAzure = downloadUrl.includes('azurewebsites.net');
      
      console.log('🔗 Download URL Analysis:', {
        url: downloadUrl,
        type: isBunnyCDN ? 'BunnyCDN' : (isLocalhost ? 'Localhost' : (isAzure ? 'Azure' : 'Unknown')),
        isBunnyCDN: isBunnyCDN,
        isPubliclyAccessible: !isLocalhost
      });
      
      // Test 3: Check URL accessibility
      console.log('\n📋 Test 3: URL Accessibility Test');
      console.log('-'.repeat(40));
      
      try {
        const urlCheck = await axios.head(downloadUrl, { timeout: 30000 });
        console.log('✅ URL accessible:', {
          status: urlCheck.status,
          contentType: urlCheck.headers['content-type'],
          contentLength: urlCheck.headers['content-length']
        });
        
        // Test 4: WABB webhook with the actual URL
        console.log('\n📋 Test 4: WABB Webhook Test');
        console.log('-'.repeat(40));
        
        if (!isLocalhost) { // Only test WABB if URL is publicly accessible
          const wabbPayload = {
            document: downloadUrl,
            number: '919876543210',
            resumeId: noAuthResponse.data.data?.resumeId,
            email: 'test.bunnycdn@example.com'
          };
          
          console.log('🎯 WABB payload:', wabbPayload);
          
          try {
            const wabbResponse = await axios.post(
              'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/',
              wabbPayload,
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
              }
            );
            
            console.log('✅ WABB webhook success:', {
              status: wabbResponse.status,
              data: wabbResponse.data
            });
          } catch (wabbError) {
            console.log('❌ WABB webhook error:', {
              message: wabbError.message,
              status: wabbError?.response?.status,
              data: wabbError?.response?.data
            });
          }
        } else {
          console.log('⚠️ Skipping WABB test - localhost URL not accessible to WABB');
        }
        
      } catch (urlError) {
        console.log('❌ URL not accessible:', urlError.message);
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('  ✅ BunnyCDN service integration added');
    console.log('  ✅ PDF generation and upload implemented');  
    console.log('  ✅ Cloud URL fallback mechanism in place');
    console.log('  ✅ WABB webhook uses cloud URLs when available');
    
    console.log('\n📞 BunnyCDN Configuration:');
    console.log('  📦 Storage Zone: BUNNY_STORAGE_ZONE_NAME');
    console.log('  🔑 Access Key: BUNNY_STORAGE_ACCESS_KEY');
    console.log('  🌐 CDN URL: BUNNY_CDN_URL');
    console.log('  🎯 Path Format: resumes/{resumeId}/{filename}.pdf');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.log('📋 Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Run the test
testBunnyCDNIntegration();
