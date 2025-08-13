const fs = require('fs');
const pdfParse = require('pdf-parse');

async function testPdfParsing() {
  console.log('🔍 Testing PDF parsing...');
  
  const testFiles = [
    './test-resume.pdf',
    './apps/api/node_modules/pdf-parse/test/data/04-valid.pdf'
  ];
  
  for (const filePath of testFiles) {
    console.log(`\n📁 Testing file: ${filePath}`);
    
    try {
      const startTime = Date.now();
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log('❌ File does not exist');
        continue;
      }
      
      console.log('📖 Reading file buffer...');
      const fileBuffer = fs.readFileSync(filePath);
      console.log(`📊 File size: ${fileBuffer.length} bytes`);
      
      console.log('⚡ Starting PDF parsing...');
      
      // Add timeout to PDF parsing
      const parsePromise = pdfParse(fileBuffer);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF parsing timeout')), 3000);
      });
      
      const pdfData = await Promise.race([parsePromise, timeoutPromise]);
      const endTime = Date.now();
      
      console.log(`✅ Success! Parsing took ${endTime - startTime}ms`);
      console.log(`📝 Text length: ${pdfData.text.length} characters`);
      console.log(`📄 Text preview: ${pdfData.text.substring(0, 200)}...`);
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

testPdfParsing().catch(console.error);
