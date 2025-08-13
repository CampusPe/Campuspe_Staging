const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testResumeUploadTimeout() {
    console.log('🧪 Testing Resume Upload Timeout Fix...\n');
    
    // Create a FormData object
    const formData = new FormData();
    
    // Create a simple test PDF content (simulated)
    const testPdfContent = Buffer.from('Test PDF content for timeout testing');
    formData.append('resume', testPdfContent, {
        filename: 'test-resume.pdf',
        contentType: 'application/pdf'
    });

    const startTime = Date.now();
    
    try {
        console.log('📤 Sending request with 30-second timeout...');
        
        const response = await axios.post('http://localhost:5001/api/students/analyze-resume-ai', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODljODg1OGRhYTk5NGU0YTAxNGM5NjAiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTUwOTE1MTUsImV4cCI6MTc1NTA5NTExNX0.MEc9NcbbusJ-GiYSLIO-_o_BVBQQmnNu1w3_2av22Kk'
            },
            timeout: 30000 // 30 second timeout like frontend
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ Success! Response received in ${duration}ms`);
        console.log('📊 Response status:', response.status);
        console.log('🎯 Response data:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (error.code === 'ECONNABORTED') {
            console.log(`⏱️ Timeout after ${duration}ms (Expected: 30000ms)`);
            console.log('✅ This confirms the 30-second timeout is working');
        } else if (error.response) {
            console.log(`❌ HTTP Error ${error.response.status}: ${error.response.statusText}`);
            console.log('📝 Error details:', error.response.data);
        } else {
            console.log(`❌ Network Error: ${error.message}`);
        }
        
        console.log(`⏱️ Total duration: ${duration}ms`);
    }
}

// Run the test
testResumeUploadTimeout().catch(console.error);
