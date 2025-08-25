#!/usr/bin/env node

/**
 * 🔍 Check where resume data is actually stored
 */

require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

async function checkResumeStorage() {
  console.log('🔍 Checking Resume Storage Locations');
  console.log('=' .repeat(50));

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = mongoose.connection.db;
    
    // Check GeneratedResumes collection
    console.log('\n📊 GeneratedResumes Collection:');
    const generatedResumesCount = await db.collection('generatedresumes').countDocuments();
    console.log(`Documents: ${generatedResumesCount}`);
    
    // Check Students with aiResumeHistory
    console.log('\n👥 Students with AI Resume History:');
    const studentsWithHistory = await db.collection('students').find({
      aiResumeHistory: { $exists: true, $ne: [] }
    }).toArray();
    
    let totalResumeHistory = 0;
    studentsWithHistory.forEach((student, index) => {
      const historyCount = student.aiResumeHistory ? student.aiResumeHistory.length : 0;
      totalResumeHistory += historyCount;
      console.log(`${index + 1}. Student ${student._id}: ${historyCount} resumes in history`);
    });
    
    console.log(`\nTotal resumes in aiResumeHistory: ${totalResumeHistory}`);
    
    // Check recent resume history entries
    if (studentsWithHistory.length > 0) {
      console.log('\n📋 Recent Resume History Entries:');
      studentsWithHistory.forEach((student, studentIndex) => {
        if (student.aiResumeHistory && student.aiResumeHistory.length > 0) {
          console.log(`\nStudent ${studentIndex + 1} (${student._id}):`);
          student.aiResumeHistory.slice(-3).forEach((resume, resumeIndex) => {
            console.log(`  ${resumeIndex + 1}. Job: ${resume.jobTitle || 'No title'}`);
            console.log(`     Generated: ${resume.generatedAt}`);
            console.log(`     PDF URL: ${resume.pdfUrl || 'No URL'}`);
          });
        }
      });
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 Resume Storage Analysis:');
    console.log(`📊 GeneratedResumes Collection: ${generatedResumesCount} documents`);
    console.log(`👥 Students with history: ${studentsWithHistory.length}`);
    console.log(`📝 Total resume history entries: ${totalResumeHistory}`);
    
    if (generatedResumesCount === 0 && totalResumeHistory > 0) {
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('- Resumes are being saved to Student.aiResumeHistory only');
      console.log('- GeneratedResumes collection is empty');
      console.log('- Frontend is likely reading from aiResumeHistory');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkResumeStorage().catch(console.error);
