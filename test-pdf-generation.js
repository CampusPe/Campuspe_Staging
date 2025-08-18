const resumeBuilderService = require('./apps/api/dist/services/resume-builder').default;

async function testPDFGeneration() {
  console.log('🧪 Testing PDF Generation...');
  
  const testHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; }
      .name { font-size: 24px; font-weight: bold; color: #1e40af; }
      .contact-item { margin: 5px; }
      .summary { margin: 20px 0; }
      .education-item { margin: 15px 0; }
      .degree { font-weight: bold; }
      .institution { color: #666; }
      .skill-item { background: #e0e7ff; padding: 3px 8px; margin: 2px; display: inline-block; }
    </style>
  </head>
  <body>
    <h1 class="name">John Doe</h1>
    <div class="contact-item"><span>📧</span><span>john.doe@email.com</span></div>
    <div class="contact-item"><span>📱</span><span>+1234567890</span></div>
    <div class="summary">Experienced software developer with 3 years of experience.</div>
    <div class="education-item">
      <div class="degree">Bachelor of Computer Science</div>
      <div class="institution">University of Technology</div>
    </div>
    <span class="skill-item">JavaScript</span>
    <span class="skill-item">React</span>
    <span class="skill-item">Node.js</span>
  </body>
  </html>
  `;
  
  try {
    console.log('📄 Generating PDF...');
    const pdfBuffer = await resumeBuilderService.generatePDF(testHTML);
    
    console.log('✅ PDF generated successfully!');
    console.log('📊 PDF size:', pdfBuffer.length, 'bytes');
    console.log('📁 PDF starts with:', pdfBuffer.toString('ascii', 0, 10));
    
    if (pdfBuffer.toString('ascii', 0, 4) === '%PDF') {
      console.log('✅ Valid PDF format detected');
    } else {
      console.log('❌ Invalid PDF format');
    }
    
    // Save test PDF
    const fs = require('fs');
    fs.writeFileSync('./test-resume.pdf', pdfBuffer);
    console.log('💾 Test PDF saved as test-resume.pdf');
    
    await resumeBuilderService.closeBrowser();
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    console.log('🔍 This indicates the fallback PDF generation will be used');
  }
}

testPDFGeneration().catch(console.error);
