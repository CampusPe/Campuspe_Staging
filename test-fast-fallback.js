const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testFastFallback() {
    console.log('⚡ Testing Fast Fallback Resume Analysis...\n');
    
    // Create a proper PDF header for better testing
    const pdfHeader = Buffer.from([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
        0x0A, 0x25, 0xC4, 0xE5, 0xF2, 0xE5, 0xEB, 0xA7, 0xF3, 0xA0, 0xD0, 0xC4, 0xC6, 0x0A
    ]);
    
    const resumeContent = `
JOHN DOE
Software Engineer
Email: john@example.com
Phone: +1-234-567-8900

EXPERIENCE:
- Full Stack Developer at TechCorp (2020-2023)
  * Built web applications using React, Node.js, MongoDB
  * Led team of 5 developers
  * Improved system performance by 40%

SKILLS:
JavaScript, Python, React, Node.js, MongoDB, AWS, Docker

EDUCATION:
Bachelor of Computer Science, MIT (2020)
`;
    
    const testPdfContent = Buffer.concat([pdfHeader, Buffer.from(resumeContent)]);
    
    const formData = new FormData();
    formData.append('resume', testPdfContent, {
        filename: 'john-doe-resume.pdf',
        contentType: 'application/pdf'
    });

    const startTime = Date.now();
    
    try {
        console.log('📤 Sending resume analysis request...');
        console.log('⏱️ Expecting response within 5-10 seconds due to aggressive timeouts');
        
        const response = await axios.post('http://localhost:5001/api/students/analyze-resume-ai', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODljODg1OGRhYTk5NGU0YTAxNGM5NjAiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTUwOTE1MTUsImV4cCI6MTc1NTA5NTExNX0.MEc9NcbbusJ-GiYSLIO-_o_BVBQQmnNu1w3_2av22Kk'
            },
            timeout: 30000 // 30 second timeout like frontend
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ SUCCESS! Resume analysis completed in ${duration}ms`);
        console.log('📊 Response status:', response.status);
        
        if (response.data.success) {
            console.log('🎯 Analysis type:', response.data.analysisSource || 'Not specified');
            console.log('📝 Skills found:', response.data.data?.skills?.length || 0);
            console.log('💼 Experience years:', response.data.data?.experience_years || 'Not calculated');
            console.log('🎓 Education level:', response.data.data?.education_level || 'Not determined');
            
            if (duration < 10000) {
                console.log('⚡ FAST RESPONSE - Timeout optimization working!');
            } else {
                console.log('⏳ Slower response - may need more optimization');
            }
        } else {
            console.log('❌ Analysis failed:', response.data.error);
        }
        
    } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (error.code === 'ECONNABORTED') {
            console.log(`⏱️ Timeout after ${duration}ms`);
            console.log('🔧 This means the 30-second frontend timeout kicked in');
            console.log('💡 Check if API timeouts need further reduction');
        } else if (error.response) {
            console.log(`❌ HTTP Error ${error.response.status}: ${error.response.statusText}`);
            console.log('📝 Error details:', error.response.data);
        } else {
            console.log(`❌ Network Error: ${error.message}`);
        }
        
        console.log(`⏱️ Total duration: ${duration}ms`);
    }
}

// Test with optional environment variable for bypass
async function testWithBypass() {
    console.log('\n🔧 Testing with Claude API bypass...');
    process.env.BYPASS_CLAUDE_API = 'true';
    await testFastFallback();
    delete process.env.BYPASS_CLAUDE_API;
}

// Run tests
async function runAllTests() {
    await testFastFallback();
    await testWithBypass();
}

runAllTests().catch(console.error);
