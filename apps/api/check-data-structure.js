require('dotenv').config();
const mongoose = require('mongoose');

// Define schemas directly in this script
const userSchema = new mongoose.Schema({}, { strict: false });
const recruiterSchema = new mongoose.Schema({}, { strict: false });
const connectionSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Recruiter = mongoose.model('Recruiter', recruiterSchema);
const Connection = mongoose.model('Connection', connectionSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get sample users to understand the data structure
    const sampleUsers = await User.find({}).limit(3);
    console.log('Sample users:');
    sampleUsers.forEach(user => {
      console.log({
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || 'not found',
        lastName: user.lastName || 'not found',
        firstNameEncrypted: user.firstNameEncrypted ? 'exists' : 'not found',
        lastNameEncrypted: user.lastNameEncrypted ? 'exists' : 'not found'
      });
    });
    
    // Check recruiter records
    console.log('\n--- Recruiters ---');
    const recruiters = await Recruiter.find({}).limit(2);
    recruiters.forEach(recruiter => {
      console.log({
        id: recruiter._id,
        userId: recruiter.userId,
        companyInfo: recruiter.companyInfo,
        recruiterProfile: recruiter.recruiterProfile
      });
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
