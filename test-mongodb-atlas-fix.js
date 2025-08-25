const axios = require('axios');

// Test the MongoDB Atlas fix
async function testResumeGeneration() {
  try {
    console.log('🧪 Testing MongoDB Atlas Resume Storage Fix...\n');

    // First, check current GeneratedResume collection count
    console.log('📊 Checking current GeneratedResume collection status...');
    const checkResponse = await axios.post('http://localhost:5001/api/admin/debug/comprehensive-check');
    
    if (checkResponse.data.success) {
      const dbInfo = checkResponse.data.data.databaseInfo;
      console.log(`📋 Current GeneratedResume documents: ${dbInfo.generatedResumeCount}`);
      console.log(`📋 Current Student.aiResumeHistory documents: ${dbInfo.studentAiHistoryCount}\n`);
    }

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

    const resumeResponse = await axios.post('http://localhost:5001/api/ai-resume/generate', {
      email: 'premthakare26@gmail.com',
      jobDescription: testJobDescription
    });

    if (resumeResponse.data.success) {
      console.log('✅ Resume generated successfully!');
      console.log('📄 Resume ID:', resumeResponse.data.data.resumeId);
      console.log('📁 File Name:', resumeResponse.data.data.fileName);
      console.log('🔗 Download URL:', resumeResponse.data.data.downloadUrl);
      console.log('📊 PDF Size:', resumeResponse.data.data.pdfSize, 'bytes\n');

      // Wait a moment then check the database again
      console.log('⏳ Waiting 3 seconds for database sync...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('📊 Checking database after resume generation...');
      const finalCheckResponse = await axios.post('http://localhost:5001/api/admin/debug/comprehensive-check');
      
      if (finalCheckResponse.data.success) {
        const finalDbInfo = finalCheckResponse.data.data.databaseInfo;
        console.log(`📋 Final GeneratedResume documents: ${finalDbInfo.generatedResumeCount}`);
        console.log(`📋 Final Student.aiResumeHistory documents: ${finalDbInfo.studentAiHistoryCount}`);
        
        if (finalDbInfo.generatedResumeCount > 0) {
          console.log('\n🎉 SUCCESS! Resume was saved to MongoDB Atlas GeneratedResume collection!');
          console.log('✅ The fix is working correctly - resumes are now storing in the correct collection.');
        } else {
          console.log('\n❌ Issue persists: Resume not saved to GeneratedResume collection');
          console.log('🔍 Need to investigate further...');
        }
      }

    } else {
      console.log('❌ Resume generation failed:', resumeResponse.data.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testResumeGeneration();
