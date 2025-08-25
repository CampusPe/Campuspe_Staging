const axios = require('axios');

// Test the actual endpoint that the frontend uses
async function testActualEndpoint() {
  try {
    console.log('🧪 Testing the actual frontend endpoint...\n');

    // Test the /generate-ai endpoint with authentication
    // First we need to get an auth token or simulate the request

    // Let's try the debug endpoint that doesn't need auth but follows the same path
    const testData = {
      email: 'premthakare26@gmail.com',
      jobDescription: `
        Senior Software Engineer - Full Stack Development
        
        We are seeking an experienced Full Stack Developer to join our innovative team.
        
        Key Responsibilities:
        • Develop scalable web applications using modern frameworks
        • Design and implement RESTful APIs and microservices
        • Work with databases (MongoDB, PostgreSQL)
        • Collaborate with cross-functional teams in an agile environment
        • Mentor junior developers and participate in code reviews
        
        Required Skills:
        • 5+ years of experience in JavaScript/TypeScript
        • Proficiency in React.js, Node.js, Express.js
        • Experience with cloud platforms (AWS, Azure, GCP)
        • Strong understanding of database design and optimization
        • Experience with Git, CI/CD pipelines
        • Knowledge of testing frameworks (Jest, Cypress)
        
        Preferred Qualifications:
        • Experience with Docker and Kubernetes
        • Knowledge of GraphQL and WebSocket technologies
        • Familiarity with serverless architectures
        • Bachelor's degree in Computer Science or equivalent experience
        
        We offer competitive compensation, comprehensive benefits, and opportunities for professional growth.
      `.trim()
    };

    console.log('🚀 Testing debug-no-auth endpoint to trace the generation flow...');
    console.log('📝 Job description length:', testData.jobDescription.length, 'characters');

    const response = await axios.post('http://localhost:5001/api/ai-resume-builder/debug-no-auth', testData);

    if (response.data.success) {
      console.log('\n✅ Debug endpoint responded successfully!');
      console.log('📊 Response summary:', {
        success: response.data.success,
        hasResumeData: !!response.data.data?.resumeData,
        hasDownloadUrl: !!response.data.data?.downloadUrl,
        message: response.data.message
      });
      
      console.log('\n📄 Full response structure:');
      console.log(JSON.stringify(response.data, null, 2));

    } else {
      console.log('❌ Debug endpoint failed:', response.data.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Endpoint not found. Let\'s check available endpoints...');
    }
  }
}

// Test save-resume endpoint with proper data structure
async function testSaveResumeDirectly() {
  try {
    console.log('\n🔄 Testing save-resume endpoint directly...\n');

    const testResumeData = {
      studentEmail: 'premthakare26@gmail.com',
      jobDescription: 'Software Engineer position requiring React and Node.js skills',
      resumeData: {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'premthakare26@gmail.com',
          phone: '+919876543210',
          address: 'Mumbai, India',
          linkedin: 'linkedin.com/in/testuser',
          website: 'testuser.dev'
        },
        summary: 'Experienced software engineer with expertise in React and Node.js',
        skills: [
          { name: 'JavaScript', level: 'Advanced', category: 'Technical' },
          { name: 'React.js', level: 'Advanced', category: 'Technical' },
          { name: 'Node.js', level: 'Intermediate', category: 'Technical' },
          { name: 'MongoDB', level: 'Intermediate', category: 'Database' }
        ],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Software Engineer',
            startDate: '2022-01',
            endDate: '2024-01',
            description: 'Developed web applications using React and Node.js',
            responsibilities: ['Built responsive UIs', 'Designed APIs', 'Optimized performance']
          }
        ],
        education: [
          {
            institution: 'University of Technology',
            degree: 'Bachelor of Computer Science',
            fieldOfStudy: 'Computer Science',
            graduationYear: '2021',
            gpa: '8.5'
          }
        ],
        projects: [
          {
            name: 'E-commerce Platform',
            description: 'Full-stack web application for online shopping',
            technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
            link: 'github.com/testuser/ecommerce'
          }
        ],
        certifications: [
          {
            name: 'AWS Certified Developer',
            issuer: 'Amazon Web Services',
            date: '2023-06',
            link: 'aws.amazon.com/certification'
          }
        ],
        languages: [
          { name: 'English', proficiency: 'Fluent' },
          { name: 'Hindi', proficiency: 'Native' }
        ]
      }
    };

    console.log('📝 Testing save-resume with structured data...');
    
    const response = await axios.post('http://localhost:5001/api/ai-resume-builder/save-resume', testResumeData);

    if (response.data.success) {
      console.log('✅ Save-resume endpoint worked!');
      console.log('📄 Resume ID:', response.data.data?.resumeId);
      console.log('🔗 Download URL:', response.data.data?.downloadUrl);
      console.log('📊 Response data:', response.data.data);
      
      // Now check if it was saved to MongoDB Atlas
      console.log('\n⏳ Waiting 2 seconds for database sync...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('🔍 Check MongoDB Atlas now to see if the resume was saved!');
      
    } else {
      console.log('❌ Save-resume failed:', response.data.message);
    }

  } catch (error) {
    console.error('💥 Save-resume test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting comprehensive MongoDB Atlas debugging...\n');
  
  await testActualEndpoint();
  await testSaveResumeDirectly();
  
  console.log('\n🎯 Test Complete!');
  console.log('📋 Please check the server console logs for detailed save operation messages.');
  console.log('🔍 Also check MongoDB Atlas to see if any documents were created.');
}

runTests();
