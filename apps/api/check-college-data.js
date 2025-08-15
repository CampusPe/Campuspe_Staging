const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollegeData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check our college user
    const User = mongoose.model('User', new mongoose.Schema({}));
    const college = await User.findById('688b5f4cae81090b96a8c9ca');
    console.log('College user:', college?.email, college?.role);
    
    // Check if there's a College profile
    const College = mongoose.model('College', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }));
    const collegeProfile = await College.findOne({ userId: '688b5f4cae81090b96a8c9ca' });
    console.log('College profile found:', !!collegeProfile);
    
    if (!collegeProfile) {
      console.log('❌ No college profile found - this is the issue!');
      console.log('The resend function expects a College profile, but our test user only has a User record');
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCollegeData();
