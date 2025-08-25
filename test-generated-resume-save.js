#!/usr/bin/env node

/**
 * 🧪 Test GeneratedResume Save Operation
 * This script will simulate the exact save that should happen during resume generation
 */

require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

// Simple GeneratedResume schema for testing
const GeneratedResumeSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    index: true
  },
  resumeId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // Job Information
  jobTitle: { type: String },
  jobDescription: { type: String, required: true },
  jobDescriptionHash: { type: String, required: true, index: true },
  
  // Resume Data
  resumeData: {
    personalInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      linkedin: { type: String },
      github: { type: String },
      location: { type: String }
    },
    summary: { type: String, required: true },
    skills: [{
      name: { type: String, required: true },
      level: { type: String, required: true },
      category: { type: String, required: true }
    }],
    experience: [{
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: { type: String },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      description: { type: String },
      isCurrentJob: { type: Boolean, default: false }
    }],
    education: [{
      degree: { type: String, required: true },
      field: { type: String, required: true },
      institution: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      gpa: { type: Number, min: 0, max: 10 },
      isCompleted: { type: Boolean, default: false }
    }],
    projects: [{
      name: { type: String, required: true },
      description: { type: String, required: true },
      technologies: [{ type: String }],
      link: { type: String }
    }],
    certifications: [{
      name: { type: String, required: true },
      year: { type: Number, required: true },
      organization: { type: String, required: true }
    }]
  },
  
  // File Information
  fileName: { type: String, required: true },
  filePath: { type: String },
  cloudUrl: { type: String },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, default: 'application/pdf' },
  
  // AI Analysis Results
  matchScore: { type: Number, min: 0, max: 100 },
  aiEnhancementUsed: { type: Boolean, default: false },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  suggestions: [{ type: String }],
  
  // Status and Metadata
  status: { 
    type: String, 
    enum: ['generating', 'completed', 'failed', 'expired'], 
    default: 'generating',
    index: true 
  },
  generationType: { 
    type: String, 
    enum: ['ai', 'manual', 'template'], 
    default: 'ai',
    index: true 
  },
  downloadCount: { type: Number, default: 0 },
  whatsappSharedCount: { type: Number, default: 0 },
  
  // Timestamps
  generatedAt: { type: Date, default: Date.now, index: true },
  whatsappSharedAt: [{ type: Date }],
  whatsappRecipients: [{
    phoneNumber: { type: String },
    sharedAt: { type: Date },
    status: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed'], 
      default: 'sent' 
    }
  }]
}, {
  timestamps: true
});

async function testGeneratedResumeSave() {
  console.log('🧪 Testing GeneratedResume Save Operation');
  console.log('=' .repeat(60));

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    const GeneratedResume = mongoose.model('GeneratedResume', GeneratedResumeSchema);
    
    // Get a real student ID from the database
    const db = mongoose.connection.db;
    const students = await db.collection('students').find({}).limit(1).toArray();
    
    if (students.length === 0) {
      console.error('❌ No students found in database');
      return;
    }
    
    const studentId = students[0]._id;
    console.log('📋 Using student ID:', studentId);
    
    // Create test resume data similar to what's generated
    const generatedResumeId = `resume_${Date.now()}_test`;
    const jobDescription = 'Software Engineer Position - Test job for debugging database save';
    
    console.log('\n🔧 Creating test resume document...');
    
    const testResumeData = {
      studentId: studentId,
      resumeId: generatedResumeId,
      jobTitle: 'Software Engineer',
      jobDescription: jobDescription,
      jobDescriptionHash: require('crypto').createHash('md5').update(jobDescription).digest('hex'),
      resumeData: {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '+1234567890',
          linkedin: 'https://linkedin.com/in/testuser',
          github: 'https://github.com/testuser',
          location: 'New York, NY'
        },
        summary: 'Experienced software engineer with expertise in full-stack development.',
        skills: [
          {
            name: 'JavaScript',
            level: 'Expert',
            category: 'Programming'
          },
          {
            name: 'React',
            level: 'Advanced',
            category: 'Frontend'
          }
        ],
        experience: [
          {
            title: 'Software Engineer',
            company: 'Tech Company',
            location: 'New York, NY',
            startDate: new Date('2022-01-01'),
            endDate: new Date('2024-01-01'),
            description: 'Developed web applications using React and Node.js',
            isCurrentJob: false
          }
        ],
        education: [
          {
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'University of Technology',
            startDate: new Date('2018-09-01'),
            endDate: new Date('2022-05-01'),
            gpa: 3.8,
            isCompleted: true
          }
        ],
        projects: [
          {
            name: 'Portfolio Website',
            description: 'Personal portfolio built with React and Node.js',
            technologies: ['React', 'Node.js', 'MongoDB'],
            link: 'https://example.com'
          }
        ],
        certifications: [
          {
            name: 'AWS Certified Developer',
            year: 2023,
            organization: 'Amazon Web Services'
          }
        ]
      },
      
      // Required file information
      fileName: `${generatedResumeId}.pdf`,
      filePath: null,
      cloudUrl: `http://localhost:5001/api/ai-resume-builder/download-pdf-public/${generatedResumeId}`,
      fileSize: 0,
      mimeType: 'application/pdf',
      
      // AI Analysis
      matchScore: 85,
      aiEnhancementUsed: true,
      matchedSkills: ['JavaScript', 'React'],
      missingSkills: [],
      suggestions: [],
      
      // Status
      status: 'completed',
      generationType: 'ai',
      downloadCount: 0,
      whatsappSharedCount: 0,
      
      // Timestamps
      generatedAt: new Date(),
      whatsappSharedAt: [],
      whatsappRecipients: []
    };
    
    console.log('💾 Attempting to save to GeneratedResume collection...');
    
    const generatedResume = new GeneratedResume(testResumeData);
    await generatedResume.save();
    
    console.log('✅ SUCCESS! Resume saved to GeneratedResume collection');
    console.log('📊 Saved resume details:', {
      id: generatedResume._id,
      resumeId: generatedResume.resumeId,
      studentId: generatedResume.studentId,
      status: generatedResume.status,
      fileName: generatedResume.fileName,
      cloudUrl: generatedResume.cloudUrl
    });
    
    // Verify it was saved by querying
    const savedCount = await GeneratedResume.countDocuments();
    console.log(`📄 Total documents in GeneratedResume collection: ${savedCount}`);
    
    // Clean up test document
    await GeneratedResume.deleteOne({ resumeId: generatedResumeId });
    console.log('🧹 Test document cleaned up');
    
  } catch (error) {
    console.error('❌ Error during save test:', error.message);
    if (error.name === 'ValidationError') {
      console.error('❌ Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testGeneratedResumeSave().catch(console.error);
