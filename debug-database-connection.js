#!/usr/bin/env node

/**
 * 🔍 Database Connection Debug Script
 * This script will check the actual MongoDB connection details
 */

require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

async function debugDatabaseConnection() {
  console.log('🔍 Database Connection Debug');
  console.log('=' .repeat(50));

  try {
    // Log environment variables
    console.log('\n📋 Environment Variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^:@]*@/, ':***@') : 'NOT SET');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set in environment variables');
      return;
    }

    // Connect to MongoDB
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Successfully connected to MongoDB');
    
    // Get connection details
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // Check database name
    console.log('\n📊 Database Information:');
    console.log('Database Name:', db.databaseName);
    console.log('Connection Host:', mongoose.connection.host);
    console.log('Connection Port:', mongoose.connection.port);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Collections in database:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // Check if generatedresumes collection exists
    const hasGeneratedResumes = collections.some(col => col.name === 'generatedresumes');
    console.log('\n🎯 GeneratedResumes Collection:', hasGeneratedResumes ? '✅ EXISTS' : '❌ NOT FOUND');
    
    if (hasGeneratedResumes) {
      // Count documents in generatedresumes
      const generatedResumesCount = await db.collection('generatedresumes').countDocuments();
      console.log('📄 Documents in generatedresumes:', generatedResumesCount);
      
      if (generatedResumesCount > 0) {
        // Get sample document
        const sampleDoc = await db.collection('generatedresumes').findOne({}, { projection: { resumeData: 0, pdfBase64: 0 } });
        console.log('\n📋 Sample Document Structure:');
        console.log(JSON.stringify(sampleDoc, null, 2));
      }
    }
    
    // Check students collection
    const studentsCount = await db.collection('students').countDocuments();
    console.log('\n👥 Students Collection:');
    console.log('📄 Documents in students:', studentsCount);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 Summary:');
    console.log(`✅ Connected to: ${db.databaseName}`);
    console.log(`✅ Collections found: ${collections.length}`);
    console.log(`✅ GeneratedResumes collection: ${hasGeneratedResumes ? 'EXISTS' : 'MISSING'}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.message.includes('authentication')) {
      console.error('🔐 This appears to be an authentication error');
      console.error('💡 Check your MongoDB Atlas credentials');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the debug
debugDatabaseConnection().catch(console.error);
