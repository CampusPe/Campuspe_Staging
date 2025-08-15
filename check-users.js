const mongoose = require('mongoose');
require('dotenv').config();

// Define User schema (simplified version)
const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String,
  status: String
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all users with recruiter role
    const recruiters = await User.find({ role: 'recruiter' }).select('email firstName lastName role status');
    console.log('\nRecruiters found:');
    recruiters.forEach(r => console.log(`- ${r.email} (${r.firstName} ${r.lastName}) - Status: ${r.status}`));
    
    // Check for any user that might be a recruiter
    const allUsers = await User.find({}).select('email firstName lastName role status');
    console.log('\nAll users in database:');
    allUsers.forEach(u => console.log(`- ${u.email} | Role: ${u.role} | Status: ${u.status}`));
    
    console.log(`\nTotal users: ${allUsers.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUsers();
