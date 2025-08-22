const axios = require('axios');

// Test with real user data that would generate the PDF you showed
const testData = {
  email: 'prem.thakare@example.com',
  phone: '+919876543210',
  jobDescription: `
Digital Marketing Specialist Position

We are seeking a dynamic Digital Marketing Specialist to join our team. The ideal candidate should have:

- Strong experience in digital marketing strategies
- Proficiency in SEO, SEM, and social media marketing
- Content creation and copywriting skills
- Experience with Google Analytics and data analysis
- Knowledge of email marketing campaigns
- Ability to manage ads on various platforms
- Creative thinking and problem-solving skills
- Strong attention to detail and adaptability

Responsibilities:
- Develop and implement comprehensive digital marketing strategies
- Create engaging content for various digital platforms
- Analyze campaign performance and optimize for better results
- Manage social media accounts and online presence
- Collaborate with cross-functional teams
- Stay updated with latest digital marketing trends

Requirements:
- Bachelor's degree in Marketing, Business, or related field
- 2+ years of experience in digital marketing
- Proficiency in marketing tools and analytics platforms
- Strong communication and creative skills
`
};

async function testRealWABB() {
  console.log('🧪 Testing WABB with Real User Data...\n');
  
  const azureUrl = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb-complete/generate';
  
  try {
    console.log('📡 Sending request...');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const startTime = Date.now();
    
    const response = await axios.post(azureUrl, testData, {
      timeout: 120000, // 2 minutes
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n✅ Response received:');
    console.log('⏱️  Duration:', duration, 'seconds');
    console.log('📊 Status:', response.status);
    
    const data = response.data;
    console.log('\n📄 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data && data.data.resumeContent) {
      console.log('\n📝 Resume Content Analysis:');
      const content = data.data.resumeContent;
      
      console.log('Summary:', content.summary);
      console.log('Skills:', content.skills);
      console.log('Experience:', JSON.stringify(content.experience, null, 2));
      console.log('Education:', JSON.stringify(content.education, null, 2));
      console.log('Projects:', JSON.stringify(content.projects, null, 2));
    }
    
    // Check if PDF is actually generated with content
    if (data.pdfBase64) {
      const pdfSize = Buffer.from(data.pdfBase64, 'base64').length;
      console.log('\n📄 PDF Analysis:');
      console.log('- Base64 length:', data.pdfBase64.length);
      console.log('- PDF size:', Math.round(pdfSize / 1024), 'KB');
      
      // Save PDF to inspect
      const fs = require('fs');
      const pdfBuffer = Buffer.from(data.pdfBase64, 'base64');
      const fileName = `debug-resume-${Date.now()}.pdf`;
      fs.writeFileSync(fileName, pdfBuffer);
      console.log('- Saved as:', fileName);
      
      // Try to extract text to see content
      if (pdfSize < 5000) {
        console.log('⚠️ PDF size is very small - might be basic content');
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run test
testRealWABB();
