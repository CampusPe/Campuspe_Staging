const axios = require('axios');

// Test data
const testData = {
  email: 'test@campuspe.com',
  phone: '+917896543210',
  jobDescription: `
Software Developer Position - React & Node.js

We are looking for a skilled Software Developer to join our team. The ideal candidate should have:
- Strong experience with React.js and modern JavaScript frameworks
- Backend development experience with Node.js and Express
- Database knowledge (MongoDB/PostgreSQL) 
- API development and integration skills
- Experience with Git version control
- Knowledge of cloud platforms (AWS/Azure)
- Strong problem-solving abilities
- Team collaboration skills

Responsibilities:
- Develop and maintain web applications
- Build responsive user interfaces
- Create and optimize APIs
- Work with databases and data modeling
- Participate in code reviews
- Collaborate with cross-functional teams

Requirements:
- Bachelor's degree in Computer Science or related field
- 2+ years of software development experience
- Proficiency in React, Node.js, JavaScript/TypeScript
- Experience with modern development tools and practices
`
};

async function testWABBAI() {
  console.log('🧪 Testing WABB AI Resume Generation...\n');
  
  // Test Azure API endpoint
  const azureUrl = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb-complete/generate';
  
  try {
    console.log('📡 Sending request to Azure endpoint...');
    console.log('URL:', azureUrl);
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const startTime = Date.now();
    
    const response = await axios.post(azureUrl, testData, {
      timeout: 120000, // 2 minutes timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n✅ SUCCESS! Response received:');
    console.log('⏱️  Duration:', duration, 'seconds');
    console.log('📊 Status:', response.status);
    console.log('📄 Response data:');
    
    const data = response.data;
    console.log('- Success:', data.success);
    console.log('- Message:', data.message);
    
    if (data.data) {
      console.log('- File Name:', data.data.fileName);
      console.log('- PDF Size:', Math.round(data.data.pdfSize / 1024), 'KB');
      console.log('- Timestamp:', data.data.timestamp);
      
      if (data.data.resumeContent) {
        console.log('\n📝 Resume Content Generated:');
        console.log('- Summary:', data.data.resumeContent.summary.substring(0, 100) + '...');
        console.log('- Skills Count:', data.data.resumeContent.skills.length);
        console.log('- Experience Count:', data.data.resumeContent.experience.length);
        console.log('- Education Count:', data.data.resumeContent.education.length);
        console.log('- Projects Count:', data.data.resumeContent.projects.length);
        
        console.log('\n🔧 Skills Generated:');
        data.data.resumeContent.skills.forEach((skill, i) => {
          console.log(`  ${i+1}. ${skill}`);
        });
      }
      
      if (data.pdfBase64) {
        console.log('\n📄 PDF Base64 length:', data.pdfBase64.length, 'characters');
        
        // Save PDF to file for inspection
        const fs = require('fs');
        const pdfBuffer = Buffer.from(data.pdfBase64, 'base64');
        const fileName = `test-resume-${Date.now()}.pdf`;
        fs.writeFileSync(fileName, pdfBuffer);
        console.log('💾 PDF saved as:', fileName);
      }
    }
    
    console.log('\n🎉 AI Resume Generation Test PASSED!');
    
  } catch (error) {
    console.error('\n❌ ERROR during WABB AI test:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    
    console.log('\n🔍 Debugging info:');
    console.log('- Timeout setting:', '120 seconds');
    console.log('- URL tested:', azureUrl);
    console.log('- Request payload size:', JSON.stringify(testData).length, 'characters');
  }
}

// Run the test
testWABBAI();
