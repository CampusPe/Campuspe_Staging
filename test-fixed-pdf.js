const axios = require('axios');
const fs = require('fs');

async function testFixedPDF() {
  try {
    console.log('Testing fixed AI resume PDF generation...');
    
    // Test data with all sections
    const testResumeData = {
      personalInfo: {
        name: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        location: "Test City, TC"
      },
      summary: "Test summary for AI-generated resume",
      skills: ["JavaScript", "React", "Node.js"],
      experience: [
        {
          title: "Software Developer",
          company: "Test Company",
          location: "Remote",
          duration: "Jan 2022 - Present",
          description: ["Developed web applications", "Managed databases"]
        },
        {
          title: "Junior Developer", 
          company: "Previous Company",
          location: "City, ST",
          duration: "Jun 2020 - Dec 2021",
          description: "Built frontend components"
        }
      ],
      education: [
        {
          degree: "Bachelor of Science in Computer Science",
          institution: "Test University",
          year: "2020",
          gpa: "3.8"
        }
      ],
      projects: [
        {
          name: "Test Project",
          description: "A sample project for testing",
          technologies: ["React", "MongoDB"],
          link: "https://github.com/test/project"
        }
      ]
    };

    // API endpoint for generating PDF
    const apiUrl = 'https://campuspe-api-staging.azurewebsites.net/api/ai-resume-builder/generate-pdf';
    
    console.log('Sending request to generate PDF...');
    
    const response = await axios.post(apiUrl, {
      resumeData: testResumeData,
      jobTitle: "Software Developer Position"
    }, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      // Save the PDF file
      fs.writeFileSync('test-fixed-resume.pdf', response.data);
      console.log('✅ PDF generated successfully!');
      console.log('📄 Saved as: test-fixed-resume.pdf');
      console.log(`📊 File size: ${response.data.length} bytes`);
      
      // Check if PDF is a reasonable size (should be larger than before)
      if (response.data.length > 10000) {
        console.log('✅ PDF appears to have content (good file size)');
      } else {
        console.log('⚠️  PDF seems small, might be missing content');
      }
    } else {
      console.log('❌ Failed to generate PDF');
      console.log('Status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing PDF generation:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data.toString());
    }
  }
}

testFixedPDF();
