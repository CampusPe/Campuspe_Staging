require('dotenv').config();
const mongoose = require('mongoose');

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false });
const recruiterSchema = new mongoose.Schema({}, { strict: false });
const collegeSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Recruiter = mongoose.model('Recruiter', recruiterSchema);
const College = mongoose.model('College', collegeSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check what the target IDs actually point to
    const targetId1 = '689de5b7f702b7a06b34dfef';
    const targetId2 = '689ef03bc4bb994e673e9f73';
    
    console.log('Checking target ID 1:', targetId1);
    const recruiterModel1 = await Recruiter.findById(targetId1);
    if (recruiterModel1) {
      console.log('This is a Recruiter model with userId:', recruiterModel1.userId);
    }
    
    console.log('\nChecking target ID 2:', targetId2);
    const collegeModel2 = await College.findById(targetId2);
    if (collegeModel2) {
      console.log('This is a College model with userId:', collegeModel2.userId);
    }
    
    // Get the actual User IDs
    const recruiterUser = await User.findOne({ email: 'ankita_lokhande@campuspe.com' });
    const collegeUser = await User.findOne({ email: 'ankitalokhande1904@gmail.com' });
    
    console.log('\nActual User IDs:');
    console.log('Recruiter User ID:', recruiterUser._id);
    console.log('College User ID:', collegeUser._id);
    
    // Find the Recruiter and College models for these users
    const recruiterModel = await Recruiter.findOne({ userId: recruiterUser._id });
    const collegeModel = await College.findOne({ userId: collegeUser._id });
    
    console.log('\nCorresponding Model IDs:');
    console.log('Recruiter Model ID:', recruiterModel?._id);
    console.log('College Model ID:', collegeModel?._id);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
