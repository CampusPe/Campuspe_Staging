const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define schemas
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  status: String,
  isVerified: Boolean,
  phone: String,
  firstName: String,
  lastName: String,
  createdAt: { type: Date, default: Date.now }
});

const recruiterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  companyName: String,
  companyDomain: String,
  companySize: String,
  industry: String,
  location: String,
  website: String,
  description: String,
  status: { type: String, default: 'active' },
  isApproved: { type: Boolean, default: false },
  approvedBy: String,
  approvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Recruiter = mongoose.model('Recruiter', recruiterSchema);

async function createTestRecruiter() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Hash the password
    const hashedPassword = await bcrypt.hash('pppppp', 10);

    // Create test user
    const testUser = new User({
      email: 'test_recruiter@campuspe.com',
      password: hashedPassword,
      role: 'recruiter',
      status: 'active',
      isVerified: true,
      phone: '+919876543210', // Adding unique phone number
      firstName: 'Test',
      lastName: 'Recruiter'
    });

    const savedUser = await testUser.save();
    console.log('✅ Test user created:', savedUser.email);

    // Create recruiter profile
    const testRecruiter = new Recruiter({
      userId: savedUser._id,
      companyName: 'Test Company Ltd.',
      companyDomain: 'testcompany.com',
      companySize: '51-200',
      industry: 'Technology',
      location: 'Mumbai, India',
      website: 'https://testcompany.com',
      description: 'A test company for testing recruiter functionality',
      isApproved: true,
      approvedBy: 'admin',
      approvedAt: new Date()
    });

    const savedRecruiter = await testRecruiter.save();
    console.log('✅ Test recruiter profile created');

    console.log('\n📋 Test Account Details:');
    console.log('Email: test_recruiter@campuspe.com');
    console.log('Password: pppppp');
    console.log('Role: recruiter');
    console.log('Status: active, verified, approved');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestRecruiter();
