#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

async function testProfessionalPDF() {
  try {
    console.log('🧪 Testing Professional PDF Generation...');
    
    // Test data - adjust this user ID to a valid one in your database
    const userId = "675eb30b6ceec8ecc7c31f8e"; // Prem's user ID
    
    const response = await axios.post('http://localhost:5001/api/resume-builder/generate', {}, {
      headers: {
        'Authorization': `Bearer YOUR_JWT_TOKEN_HERE`, // You'll need a valid JWT token
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    
    if (response.status === 200) {
      const fileName = `test-professional-resume-${Date.now()}.pdf`;
      fs.writeFileSync(fileName, response.data);
      console.log(`✅ Professional PDF generated successfully: ${fileName}`);
      console.log(`📄 File size: ${response.data.length} bytes`);
    } else {
      console.log('❌ Failed to generate PDF:', response.status);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Server Error:', error.response.status, error.response.data.toString());
    } else if (error.request) {
      console.log('❌ Network Error:', error.message);
      console.log('💡 Make sure the API server is running on http://localhost:5001');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Run the test
testProfessionalPDF();
