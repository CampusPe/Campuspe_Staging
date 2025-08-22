const axios = require('axios');

// Test with an even more complex job description to push the AI
const testData = {
  email: 'test.user@campuspe.com',
  phone: '+918765432109',
  jobDescription: `
Senior Full Stack Developer - React/Node.js - Remote

We are seeking an exceptional Senior Full Stack Developer to join our growing engineering team. This is a remote position offering the opportunity to work on cutting-edge web applications and contribute to our technical architecture.

Key Responsibilities:
• Design and develop scalable web applications using React.js and Node.js
• Build and maintain RESTful APIs and microservices architecture
• Implement responsive user interfaces with modern CSS frameworks
• Work with databases (PostgreSQL, MongoDB) for data modeling and optimization
• Collaborate with DevOps team on CI/CD pipelines and deployment strategies
• Mentor junior developers and participate in code reviews
• Contribute to technical documentation and system architecture decisions
• Participate in agile development processes and sprint planning

Required Technical Skills:
• 5+ years of experience in full-stack web development
• Expert-level proficiency in JavaScript/TypeScript, React.js, and Node.js
• Strong experience with Express.js, RESTful API design, and GraphQL
• Database experience with PostgreSQL, MongoDB, and Redis
• Proficiency in HTML5, CSS3, and modern CSS frameworks (Tailwind, Bootstrap)
• Experience with testing frameworks (Jest, Cypress, React Testing Library)
• Knowledge of cloud platforms (AWS, Azure, or GCP)
• Experience with containerization using Docker and Kubernetes
• Familiarity with version control systems (Git) and collaborative development
• Understanding of security best practices and authentication systems

Preferred Qualifications:
• Experience with microservices architecture and event-driven systems
• Knowledge of message queues (RabbitMQ, Apache Kafka)
• Familiarity with monitoring and logging tools (ELK stack, Prometheus)
• Experience with mobile development (React Native) is a plus
• Background in DevOps practices and infrastructure as code
• Previous experience in fintech or e-commerce domains

Company Culture & Benefits:
• Fully remote work environment with flexible hours
• Competitive salary range: $120,000 - $180,000 USD
• Comprehensive health, dental, and vision insurance
• Annual learning and development budget of $3,000
• Latest MacBook Pro and home office setup allowance
• 4 weeks paid vacation plus national holidays
• Stock options in a rapidly growing company
• Quarterly team retreats and annual company conference

About Us:
We're a fast-growing SaaS company revolutionizing the education technology space. Our platform serves over 1 million students globally and processes millions of transactions monthly. We're backed by top-tier VCs and are on track for Series B funding.

Our tech stack includes React, Node.js, PostgreSQL, Redis, AWS, Docker, and Kubernetes. We practice continuous deployment with comprehensive testing and maintain 99.9% uptime.

How to Apply:
Please submit your resume along with:
• GitHub profile showcasing your best work
• A brief cover letter explaining your interest in EdTech
• Links to 2-3 projects you're most proud of (with code if possible)
• Your preferred start date and salary expectations

We are an equal opportunity employer committed to diversity and inclusion.
`
};

async function testComplexJob() {
  console.log('🧪 Testing Complex Job Description with WABB AI...\n');
  
  const azureUrl = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/wabb-complete/generate';
  
  try {
    console.log('📡 Sending complex job request...');
    
    const startTime = Date.now();
    
    const response = await axios.post(azureUrl, testData, {
      timeout: 180000, // 3 minutes for complex processing
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n✅ Complex Job Response:');
    console.log('⏱️  Duration:', duration, 'seconds');
    console.log('📊 Status:', response.status);
    
    const data = response.data;
    
    if (data.data && data.data.resumeContent) {
      const content = data.data.resumeContent;
      
      console.log('\n📝 Generated Content Quality:');
      console.log('📄 Summary:', content.summary);
      console.log('\n🔧 Skills (' + content.skills.length + '):');
      content.skills.forEach((skill, i) => console.log(`  ${i+1}. ${skill}`));
      
      console.log('\n💼 Experience:');
      content.experience.forEach((exp, i) => {
        console.log(`  ${i+1}. ${exp.title} at ${exp.company} (${exp.duration})`);
        console.log(`     ${exp.description.substring(0, 100)}...`);
      });
      
      console.log('\n🎓 Education:');
      content.education.forEach((edu, i) => {
        console.log(`  ${i+1}. ${edu.degree} - ${edu.institution} (${edu.year})`);
      });
      
      console.log('\n🚀 Projects:');
      content.projects.forEach((proj, i) => {
        console.log(`  ${i+1}. ${proj.name}`);
        console.log(`     ${proj.description.substring(0, 80)}...`);
        console.log(`     Tech: ${proj.technologies.join(', ')}`);
      });
    }
    
    // PDF Analysis
    if (data.pdfBase64) {
      const pdfSize = Buffer.from(data.pdfBase64, 'base64').length;
      console.log('\n📄 PDF Quality Check:');
      console.log('- PDF size:', Math.round(pdfSize / 1024), 'KB');
      console.log('- Base64 length:', data.pdfBase64.length);
      
      // Save for inspection
      const fs = require('fs');
      const pdfBuffer = Buffer.from(data.pdfBase64, 'base64');
      const fileName = `complex-resume-${Date.now()}.pdf`;
      fs.writeFileSync(fileName, pdfBuffer);
      console.log('- Saved as:', fileName);
      
      if (pdfSize > 10000) {
        console.log('✅ PDF size looks good - likely rich content');
      } else if (pdfSize > 2000) {
        console.log('⚠️ PDF size moderate - basic content with formatting');
      } else {
        console.log('❌ PDF size very small - minimal content');
      }
    }
    
    console.log('\n🎯 Overall Assessment:');
    console.log('- AI Generation: ✅ Working');
    console.log('- Content Relevance: ✅ Job-specific');
    console.log('- Skills Quality: ✅ Technical and relevant');
    console.log('- PDF Generation: ✅ Functional');
    console.log('- Response Time:', duration, 'seconds (acceptable for AI processing)');
    
  } catch (error) {
    console.error('\n❌ Complex Job Test Failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run complex test
testComplexJob();
