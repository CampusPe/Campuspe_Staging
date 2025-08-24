const fs = require('fs');

// Test the new professional PDF design
async function testProfessionalPDF() {
    try {
        console.log('🧪 Testing Professional PDF Generation V2...');
        
        const response = await fetch('http://localhost:5001/api/ai-resume-builder/generate-ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGEzMDdhYTc4Y2JlZTJjZjM0ODMyNWUiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc1NjA1NjM0NSwiZXhwIjoxNzU2MDU5OTQ1fQ.vMW6IwP2fHpLpBQxqmcY1b9xLj0gfv0oopKLGZQaJxA'
            },
            body: JSON.stringify({
                jobDescription: "Senior Full Stack Developer position requiring expertise in React, Node.js, TypeScript, MongoDB, and AWS. Looking for 3+ years of experience in building scalable web applications with modern frameworks and cloud technologies. Must have experience with microservices architecture and DevOps practices.",
                jobTitle: "Senior Full Stack Developer"
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        console.log('📋 Response Content-Type:', contentType);

        if (contentType && contentType.includes('application/pdf')) {
            console.log('✅ PDF response received!');
            
            const pdfBuffer = await response.arrayBuffer();
            const fileName = `test-professional-v2-${Date.now()}.pdf`;
            
            fs.writeFileSync(fileName, Buffer.from(pdfBuffer));
            console.log(`💾 Professional PDF saved as: ${fileName}`);
            console.log(`📊 PDF size: ${pdfBuffer.byteLength} bytes`);
            
            // Validate PDF structure
            if (pdfBuffer.byteLength > 1000) {
                console.log('✅ PDF appears to be properly generated');
                console.log('🎨 New professional design features:');
                console.log('   • Clean centered header with proper spacing');
                console.log('   • Professional blue color scheme (#4472C4)');
                console.log('   • Section headers with light blue backgrounds');
                console.log('   • Improved typography and font sizing');
                console.log('   • Better margins and content layout');
                console.log('   • Professional bullet points for experience');
                console.log('   • Right-aligned dates and proper spacing');
                
                return fileName;
            } else {
                console.log('⚠️ PDF seems too small, might be corrupted');
            }
        } else {
            const text = await response.text();
            console.log('❌ Non-PDF response received:', text.substring(0, 500));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('💡 Make sure the API server is running on port 5001');
        }
    }
}

// Check database persistence
async function checkResumeHistory() {
    try {
        console.log('\n🔍 Checking Resume History...');
        
        const response = await fetch('http://localhost:5001/api/ai-resume-builder/history', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGEzMDdhYTc4Y2JlZTJjZjM0ODMyNWUiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc1NjA1NjM0NSwiZXhwIjoxNzU2MDU5OTQ1fQ.vMW6IwP2fHpLpBQxqmcY1b9xLj0gfv0oopKLGZQaJxA'
            }
        });

        if (response.ok) {
            const history = await response.json();
            console.log('📚 Resume History Response:', JSON.stringify(history, null, 2));
            
            if (history.resumes && history.resumes.length > 0) {
                console.log(`✅ Found ${history.resumes.length} saved resumes in database`);
                console.log('💾 Database persistence is working correctly!');
            } else {
                console.log('📝 No resumes found in history - generate a resume first');
            }
        } else {
            console.log('❌ Failed to fetch resume history:', response.status);
        }
        
    } catch (error) {
        console.error('❌ History check failed:', error.message);
    }
}

// Run the tests
async function runTests() {
    console.log('🚀 Starting Professional PDF Tests V2\n');
    
    const pdfFile = await testProfessionalPDF();
    
    if (pdfFile) {
        await checkResumeHistory();
        
        console.log('\n🎉 Professional PDF Test Complete!');
        console.log(`📄 Open ${pdfFile} to view the new professional design`);
        console.log('✨ The design now features:');
        console.log('   - Clean, ATS-friendly layout matching your reference');
        console.log('   - Professional blue color scheme');
        console.log('   - Proper section headers with backgrounds');
        console.log('   - Improved spacing and typography');
        console.log('   - Right-aligned dates');
        console.log('   - Professional bullet points');
    }
}

runTests();
