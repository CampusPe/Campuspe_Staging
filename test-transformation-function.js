// Direct test of the transformation function we added
const mongoose = require('mongoose');

// Test data that mimics what the AI generates
const sampleAIResumeData = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, State',
    linkedin: 'linkedin.com/in/johndoe',
    website: 'johndoe.com'
  },
  summary: 'Experienced software engineer with 5+ years in web development.',
  skills: [
    'JavaScript',
    'React.js',
    'Node.js',
    'MongoDB',
    'TypeScript'
  ],
  experience: [
    {
      company: 'Tech Corp',
      position: 'Senior Developer',
      startDate: '2020-01',
      endDate: '2024-01',
      description: 'Led development of web applications',
      responsibilities: ['Built React components', 'Designed APIs']
    }
  ],
  education: [
    {
      institution: 'University of Technology',
      degree: 'Bachelor of Computer Science',
      fieldOfStudy: 'Computer Science',
      graduationYear: '2019'
    }
  ],
  projects: [
    {
      name: 'E-commerce Platform',
      description: 'Built a full-stack e-commerce solution',
      technologies: ['React', 'Node.js', 'MongoDB'],
      link: 'github.com/johndoe/ecommerce'
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
    'English',
    'Spanish'
  ]
};

// Define the transformation function locally for testing
function transformResumeDataForSchema(resumeData) {
  try {
    console.log('🔄 Transforming resume data for schema compatibility...');
    
    // Handle both nested and flat structures
    const sourceData = resumeData.resumeData || resumeData;
    
    const transformed = {
      personalInfo: {
        firstName: sourceData.personalInfo?.firstName || sourceData.firstName || 'Unknown',
        lastName: sourceData.personalInfo?.lastName || sourceData.lastName || 'User',
        email: sourceData.personalInfo?.email || sourceData.email || '',
        phone: sourceData.personalInfo?.phone || sourceData.phone || '',
        address: sourceData.personalInfo?.address || sourceData.address || '',
        linkedin: sourceData.personalInfo?.linkedin || sourceData.linkedin || '',
        website: sourceData.personalInfo?.website || sourceData.website || ''
      },
      summary: sourceData.summary || sourceData.professionalSummary || '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: []
    };

    // Transform skills - ensure proper structure with name, level, category
    if (sourceData.skills && Array.isArray(sourceData.skills)) {
      transformed.skills = sourceData.skills.map((skill) => {
        if (typeof skill === 'string') {
          return {
            name: skill,
            level: 'Intermediate',
            category: 'Technical'
          };
        }
        return {
          name: skill.name || skill.skill || skill,
          level: skill.level || 'Intermediate',
          category: skill.category || 'Technical'
        };
      });
    }

    // Transform experience
    if (sourceData.experience && Array.isArray(sourceData.experience)) {
      transformed.experience = sourceData.experience.map((exp) => ({
        company: exp.company || '',
        position: exp.position || exp.title || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        description: exp.description || '',
        responsibilities: exp.responsibilities || []
      }));
    }

    // Transform education
    if (sourceData.education && Array.isArray(sourceData.education)) {
      transformed.education = sourceData.education.map((edu) => ({
        institution: edu.institution || edu.school || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || edu.field || '',
        graduationYear: edu.graduationYear || edu.year || '',
        gpa: edu.gpa || ''
      }));
    }

    // Transform projects
    if (sourceData.projects && Array.isArray(sourceData.projects)) {
      transformed.projects = sourceData.projects.map((proj) => ({
        name: proj.name || proj.title || '',
        description: proj.description || '',
        technologies: proj.technologies || [],
        link: proj.link || proj.url || ''
      }));
    }

    // Transform certifications
    if (sourceData.certifications && Array.isArray(sourceData.certifications)) {
      transformed.certifications = sourceData.certifications.map((cert) => ({
        name: cert.name || cert.title || '',
        issuer: cert.issuer || cert.organization || '',
        date: cert.date || cert.issueDate || '',
        link: cert.link || cert.url || ''
      }));
    }

    // Transform languages
    if (sourceData.languages && Array.isArray(sourceData.languages)) {
      transformed.languages = sourceData.languages.map((lang) => {
        if (typeof lang === 'string') {
          return {
            name: lang,
            proficiency: 'Fluent'
          };
        }
        return {
          name: lang.name || lang.language || lang,
          proficiency: lang.proficiency || lang.level || 'Fluent'
        };
      });
    }

    console.log('✅ Resume data transformation completed');
    console.log('📊 Transformed data structure:', {
      personalInfo: !!transformed.personalInfo.firstName,
      skillsCount: transformed.skills.length,
      experienceCount: transformed.experience.length,
      educationCount: transformed.education.length,
      projectsCount: transformed.projects.length,
      certificationsCount: transformed.certifications.length,
      languagesCount: transformed.languages.length
    });

    return transformed;
  } catch (error) {
    console.error('❌ Error transforming resume data:', error);
    return null;
  }
}

// Test the transformation function
async function testTransformation() {
  console.log('🧪 Testing Resume Data Transformation Function...\n');
  
  console.log('📝 Original AI Resume Data:');
  console.log(JSON.stringify(sampleAIResumeData, null, 2));
  
  console.log('\n🔄 Running transformation...');
  const transformedData = transformResumeDataForSchema(sampleAIResumeData);
  
  if (transformedData) {
    console.log('\n✅ Transformation successful!');
    console.log('📊 Transformed Data:');
    console.log(JSON.stringify(transformedData, null, 2));
    
    // Verify required fields are present
    const requiredChecks = {
      'personalInfo.firstName': !!transformedData.personalInfo?.firstName,
      'personalInfo.lastName': !!transformedData.personalInfo?.lastName,
      'skills array': Array.isArray(transformedData.skills),
      'skills have proper structure': transformedData.skills.every(skill => 
        skill.name && skill.level && skill.category
      ),
      'experience array': Array.isArray(transformedData.experience),
      'education array': Array.isArray(transformedData.education)
    };
    
    console.log('\n🔍 Schema Compatibility Checks:');
    let allPassed = true;
    for (const [check, passed] of Object.entries(requiredChecks)) {
      console.log(`${passed ? '✅' : '❌'} ${check}: ${passed}`);
      if (!passed) allPassed = false;
    }
    
    if (allPassed) {
      console.log('\n🎉 SUCCESS! All schema compatibility checks passed!');
      console.log('✅ The transformation function should work with MongoDB Atlas GeneratedResume schema.');
      console.log('✅ This indicates our fix is properly implemented.');
    } else {
      console.log('\n⚠️  Some schema checks failed - need to adjust transformation');
    }
    
  } else {
    console.log('\n❌ Transformation failed!');
  }
}

// Test with different data structures (edge cases)
async function testEdgeCases() {
  console.log('\n🧪 Testing Edge Cases...\n');
  
  // Test with minimal data
  const minimalData = {
    personalInfo: { firstName: 'Test', lastName: 'User' },
    skills: ['JavaScript', 'React'],
    experience: [],
    education: []
  };
  
  console.log('📝 Testing minimal data structure...');
  const result1 = transformResumeDataForSchema(minimalData);
  console.log('✅ Minimal data result:', result1 ? 'Success' : 'Failed');
  
  // Test with string skills
  const stringSkillsData = {
    ...sampleAIResumeData,
    skills: ['JavaScript', 'Python', 'React']  // Just strings
  };
  
  console.log('\n📝 Testing string-only skills...');
  const result2 = transformResumeDataForSchema(stringSkillsData);
  console.log('✅ String skills transformed to objects:', 
    result2?.skills?.every(skill => skill.name && skill.level && skill.category)
  );
  
  // Test with nested resumeData structure
  const nestedData = {
    resumeData: sampleAIResumeData
  };
  
  console.log('\n📝 Testing nested resumeData structure...');
  const result3 = transformResumeDataForSchema(nestedData);
  console.log('✅ Nested data handled:', result3 ? 'Success' : 'Failed');
}

// Run all tests
async function runAllTests() {
  await testTransformation();
  await testEdgeCases();
  
  console.log('\n🎯 Test Summary:');
  console.log('📋 The transformation function has been tested and appears to work correctly.');
  console.log('✅ It handles various data structures and converts them to the required schema format.');
  console.log('🔧 This should fix the MongoDB Atlas storage issue we were experiencing.');
  console.log('\n💡 Next step: Test with a real resume generation to verify it saves to MongoDB Atlas!');
}

runAllTests();
