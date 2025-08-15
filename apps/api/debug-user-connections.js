require('dotenv').config();
const mongoose = require('mongoose');

// Define schemas directly in this script
const userSchema = new mongoose.Schema({}, { strict: false });
const connectionSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Connection = mongoose.model('Connection', connectionSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the specific users
    const recruiterUser = await User.findOne({ email: 'ankita_lokhande@campuspe.com' });
    const collegeUser = await User.findOne({ email: 'ankitalokhande1904@gmail.com' });
    
    console.log('Recruiter User:', {
      id: recruiterUser?._id,
      email: recruiterUser?.email,
      role: recruiterUser?.role
    });
    
    console.log('College User:', {
      id: collegeUser?._id,
      email: collegeUser?.email,
      role: collegeUser?.role
    });
    
    // Check connections that involve these users
    console.log('\n--- All Connections in Database ---');
    const allConnections = await Connection.find({});
    allConnections.forEach(conn => {
      console.log({
        id: conn._id,
        requester: conn.requester,
        target: conn.target,
        status: conn.status,
        message: conn.message
      });
    });
    
    // Check specific connections for these users
    if (recruiterUser && collegeUser) {
      console.log('\n--- Connections for these specific users ---');
      const userConnections = await Connection.find({
        $or: [
          { requester: { $in: [recruiterUser._id, collegeUser._id] } },
          { target: { $in: [recruiterUser._id, collegeUser._id] } }
        ]
      });
      
      console.log('Found connections:', userConnections.length);
      userConnections.forEach(conn => {
        console.log({
          id: conn._id,
          requester: conn.requester,
          target: conn.target,
          status: conn.status,
          recruiterMatch: conn.requester.equals(recruiterUser._id) || conn.target.equals(recruiterUser._id),
          collegeMatch: conn.requester.equals(collegeUser._id) || conn.target.equals(collegeUser._id)
        });
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
