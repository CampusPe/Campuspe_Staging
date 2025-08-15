const mongoose = require('mongoose');
require('dotenv').config();

const recruiterSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId });
const Recruiter = mongoose.model('Recruiter', recruiterSchema);

async function checkRecruiterProfile() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const recruiter = await Recruiter.findOne({ userId: '689f0d4618a8b3b09b098d38' });
    console.log('Recruiter profile found:', !!recruiter);
    if (recruiter) {
      console.log('Recruiter profile ID:', recruiter._id);
    } else {
      console.log('❌ No recruiter profile found for test user');
    }
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecruiterProfile();
