const axios = require('axios');

// Simple test for MongoDB Atlas fix
async function testResumeGeneration() {
  try {
    console.log('🧪 Testing MongoDB Atlas Resume Storage Fix...\n');

    // Test with a comprehensive job description
    const testJobDescription = `
Software Engineer - Full Stack Developer
We are seeking a talented Full Stack Developer to join our dynamic team. 

Key Responsibilities:
- Develop and maintain web applications using React.js and Node.js
- Design and implement RESTful APIs
- Work with MongoDB and PostgreSQL databases
- Collaborate with cross-functional teams
- Participate in code reviews and agile development processes
- Write unit and integration tests

Required Skills:
- 3+ years of experience in JavaScript/TypeScript
- Proficiency in React.js, Node.js, Express.js
- Experience with databases (MongoDB, PostgreSQL)
- Knowledge of cloud platforms (AWS, Azure)
- Understanding of Git version control
- Strong problem-solving skills

Preferred Qualifications:
- Experience with Docker and Kubernetes
- Knowledge of CI/CD pipelines
- Familiarity with microservices architecture
- Bachelor's degree in Computer Science or related field

We offer competitive salary, comprehensive benefits, and opportunities for professional growth.
    `.trim();

    console.log('🚀 Generating AI resume with test job description...');
    console.log('📝 Job description length:', testJobDescription.length, 'characters\n');

    const resumeResponse = await axios.post('http://localhost:5001/api/ai-resume-builder/test-generate', {
      email: 'premthakare26@gmail.com',
      phone: '+919876543210',
      jobDescription: testJobDescription
    });

    if (resumeResponse.data.success) {
      console.log('✅ Resume generated successfully!');
      console.log('📄 Resume ID:', resumeResponse.data.data.resumeId);
      console.log('📁 File Name:', resumeResponse.data.data.fileName);
      console.log('🔗 Download URL:', resumeResponse.data.data.downloadUrl);
      console.log('📊 PDF Size:', resumeResponse.data.data.pdfSize, 'bytes');
      
      // Check if the downloadUrl contains the cloud URL indicating it was saved to MongoDB Atlas
      if (resumeResponse.data.data.downloadUrl && resumeResponse.data.data.downloadUrl.includes('https://')) {
        console.log('\n🎉 SUCCESS! Resume appears to have a cloud download URL!');
        console.log('✅ This indicates the resume was likely saved to MongoDB Atlas with proper cloudUrl.');
        console.log('🔗 Cloud URL found in downloadUrl, suggesting GeneratedResume collection storage worked.');
      } else {
        console.log('\n⚠️  Warning: Download URL does not appear to be a cloud URL');
        console.log('🔍 This might indicate the resume was saved to Student.aiResumeHistory instead');
      }

    } else {
      console.log('❌ Resume generation failed:', resumeResponse.data.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Make sure the server is running on http://localhost:5001');
    }
  }
}

// Run the test
testResumeGeneration();
