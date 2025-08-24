const test = require('./test-ai-resume-endpoints.js');

console.log('=== Testing AI Resume Generation and PDF Download ===');

async function testPDFGeneration() {
  try {
    // Test data that should work
    const testResumeData = {
      personalInfo: {
        firstName: "John",
        lastName: "Doe", 
        email: "john.doe@example.com",
        phone: "+1-555-123-4567",
        location: "New York, NY",
        linkedin: "https://linkedin.com/in/johndoe",
        github: "https://github.com/johndoe"
      },
      summary: "Experienced software developer with 5+ years in web development and cloud technologies.",
      skills: [
        { name: "JavaScript", level: "expert", category: "programming" },
        { name: "Python", level: "intermediate", category: "programming" },
        { name: "React", level: "expert", category: "framework" },
        { name: "Node.js", level: "expert", category: "backend" }
      ],
      experience: [
        {
          title: "Senior Software Developer",
          company: "TechCorp Inc.", 
          location: "New York, NY",
          startDate: new Date(2020, 0, 1),
          endDate: new Date(2024, 11, 31),
          description: "Led development of web applications using React and Node.js. Managed team of 3 developers.",
          isCurrentJob: true
        }
      ],
      education: [
        {
          degree: "Bachelor of Science",
          field: "Computer Science",
          institution: "State University",
          startDate: new Date(2016, 8, 1),
          endDate: new Date(2020, 4, 31), 
          isCompleted: true
        }
      ],
      projects: [
        {
          name: "E-commerce Platform",
          description: "Built a full-stack e-commerce platform with payment integration",
          technologies: ["React", "Node.js", "MongoDB", "Stripe"]
        }
      ]
    };

    console.log('📄 Testing PDF generation with structured data...');
    
    // Test local PDF generation endpoint
    const response = await fetch('http://localhost:5001/api/ai-resume-builder/download-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-test-token-here' // You'll need a valid token
      },
      body: JSON.stringify({
        resume: testResumeData,
        format: 'professional'
      })
    });

    if (response.ok) {
      console.log('✅ PDF generation successful!');
      console.log('📊 Response headers:', response.headers);
      
      // Save the PDF to test file
      const pdfBuffer = await response.arrayBuffer();
      const fs = require('fs');
      fs.writeFileSync('test-pdf-local-generation.pdf', Buffer.from(pdfBuffer));
      console.log('💾 PDF saved as test-pdf-local-generation.pdf');
      
    } else {
      console.error('❌ PDF generation failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPDFGeneration();
