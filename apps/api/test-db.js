const mongoose = require('mongoose');
const { Student } = require('./dist/models/Student');

// Connect to MongoDB
mongoose.connect('mongodb+srv://CampusPeAdmin:CampusPe@campuspestaging.adsljpw.mongodb.net/campuspe?retryWrites=true&w=majority&appName=CampuspeStaging');

async function testDatabaseSaving() {
  try {
    console.log('Connecting to database...');
    
    // Find an existing student or create one
    let student = await Student.findOne({});
    
    if (!student) {
      console.log('Creating test student...');
      student = new Student({
        userId: new mongoose.Types.ObjectId(),
        firstName: 'Test',
        lastName: 'Student',
        email: 'teststudent@example.com',
        phone: '9876543210',
        aiResumeHistory: []
      });
      await student.save();
      console.log('Test student created with ID:', student._id);
    } else {
      console.log('Found existing student with ID:', student._id);
    }

    // Test the history saving logic
    const resumeHistoryItem = {
      id: new mongoose.Types.ObjectId().toString(),
      jobDescription: 'Looking for a skilled Node.js developer with experience in MongoDB and React.',
      jobTitle: 'Node.js Developer',
      resumeData: {
        contact: {
          email: student.email,
          phone: student.phone,
          name: `${student.firstName} ${student.lastName}`
        },
        skills: ['Node.js', 'MongoDB', 'React'],
        experience: []
      },
      pdfUrl: 'https://example.com/test-resume.pdf',
      generatedAt: new Date(),
      matchScore: 85
    };

    console.log('Testing history saving...');
    console.log('Student ID:', student._id);
    console.log('Resume item:', JSON.stringify(resumeHistoryItem, null, 2));

    // Initialize aiResumeHistory if it doesn't exist
    if (!student.aiResumeHistory) {
      student.aiResumeHistory = [];
    }

    // Add new resume to history
    student.aiResumeHistory.push(resumeHistoryItem);

    // Keep only last 3 resumes
    if (student.aiResumeHistory.length > 3) {
      student.aiResumeHistory = student.aiResumeHistory.slice(-3);
    }

    // Save the document
    const savedStudent = await student.save();

    console.log('✅ Resume saved successfully!');
    console.log('Current history length:', savedStudent.aiResumeHistory.length);
    console.log('History items:', savedStudent.aiResumeHistory.map(item => ({
      id: item.id,
      jobTitle: item.jobTitle,
      generatedAt: item.generatedAt
    })));

  } catch (error) {
    console.error('❌ Error testing database saving:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDatabaseSaving();
